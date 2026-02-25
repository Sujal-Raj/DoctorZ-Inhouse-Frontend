// import { useEffect, useState, useRef } from "react";
// import { useParams, useLocation } from "react-router-dom";
// import io from "socket.io-client";
// // import api from "../../Services/mainApi";

// // Initialize socket outside component to avoid multiple connections
// const socket = io("https://doctorz-main.onrender.com", {
//   transports: ["websocket"],
// });

// const DoctorChat = () => {
//   const { roomId } = useParams(); // gets from path `/doctor-chat/:roomId`
//   const location = useLocation();
//   const {  doctorId } = location.state || {};
//   // Set user id: usually from auth context, but fallback for example
//   const userId = doctorId || "doctor";

//   interface ChatMessage {
//     _id?: string;
//     roomId: string;
//     senderId: string;
//     message: string;
//     createdAt?: string;
//   }

//   const [messages, setMessages] = useState<ChatMessage[]>([]); // each message: { _id?, roomId, senderId, message, createdAt }
//   const [msg, setMsg] = useState("");
//   const chatEndRef = useRef<HTMLDivElement>(null);

//   // Register current user with server so server's onlineUsers map is populated
//   useEffect(() => {
//     if (!userId) return;
//     socket.emit("register", userId);
//   }, [userId]);

//   // Handle socket events: set up handlers, then join room
//   useEffect(() => {
//     if (!roomId) return;

//     // history handler: server sends an array of normalized messages
//     interface ChatMessage {
//       _id?: string;
//       roomId: string;
//       senderId: string;
//       message: string;
//       createdAt?: string;
//     }

//     type HistoryEvent = ChatMessage[];

//     const handleHistory = (history: HistoryEvent) => {
//       // history expected shape: [{ _id, roomId, senderId, message, createdAt }, ...]
//       if (Array.isArray(history)) {
//       setMessages(history);
//       } else {
//       setMessages([]);
//       }
//     };

//     // incoming message handler
//     interface ReceiveMessageData {
//       _id: string;
//       roomId: string;
//       senderId: string;
//       message: string;
//       createdAt?: string;
//     }

//     const handleReceive = (data: ReceiveMessageData) => {
//       setMessages((prev: ChatMessage[]) => [
//       ...prev,
//       {
//         _id: data._id,
//         roomId: data.roomId,
//         senderId: data.senderId,
//         message: data.message,
//         createdAt: data.createdAt || new Date().toISOString(),
//       },
//       ]);
//     };

//     // error handler (optional)
//     interface SocketError {
//       message?: string;
//       code?: string | number;
//       [key: string]: any;
//     }

//     const handleError = (err: SocketError) => {
//       console.error("Socket error:", err);
//     };

//     // attach listeners BEFORE joining so we don't miss history/first messages
//     socket.on("history", handleHistory);
//     socket.on("receiveMessage", handleReceive);
//     socket.on("error", handleError);

//     // now ask server to join room (server will send "history" after join)
//     socket.emit("joinRoom", roomId);

//     return () => {
//       socket.off("history", handleHistory);
//       socket.off("receiveMessage", handleReceive);
//       socket.off("error", handleError);
//       // note: do not disconnect the socket here; just remove listeners
//     };
//   }, [roomId]);

//   // keep scroll at the bottom on new message
//   useEffect(() => {
//     if (chatEndRef.current) {
//       chatEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   const sendMessage = () => {
//     if (!msg.trim()) return;
//     if (!roomId) return;

//     const messageData = { roomId, senderId: userId, message: msg };

//     // optimistic UI update with temporary id and timestamp
//     const tempMsg = {
//       _id: `temp-${Date.now()}`,
//       roomId,
//       senderId: userId,
//       message: msg,
//       createdAt: new Date().toISOString(),
//     };

//     setMessages((prev) => [...prev, tempMsg]);

//     socket.emit("sendMessage", messageData);

//     setMsg("");
//   };

//   return (
//     <div className="h-full flex flex-col border rounded max-w-lg mx-auto mt-4 shadow-lg bg-white">
//       <div className="p-4 font-bold border-b bg-gray-100">Chat with Patient</div>
//       <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: "400px" }}>
//         {messages.map((m, i) => (
//           <div
//             key={m._id ?? i}
//             className={`mb-2 flex ${m.senderId === userId ? "justify-end" : "justify-start"}`}
//           >
//             <div
//               className={`px-3 py-2 rounded ${
//                 m.senderId === userId ? "bg-blue-500 text-white" : "bg-gray-200"
//               }`}
//             >
//               <div>{m.message}</div>
//               <div style={{ fontSize: 11, color: "#4b5563", marginTop: 6 }}>
//                 {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
//               </div>
//             </div>
//           </div>
//         ))}
//         <div ref={chatEndRef} />
//       </div>
//       <div className="flex p-2 border-t">
//         <input
//           className="flex-1 border p-2 rounded"
//           value={msg}
//           onChange={(e) => setMsg(e.target.value)}
//           placeholder="Type your message..."
//           onKeyDown={(e) => {
//             if (e.key === "Enter") sendMessage();
//           }}
//         />
//         <button
//           className="ml-2 px-4 py-2 bg-blue-500 text-white rounded shadow"
//           onClick={sendMessage}
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DoctorChat;



import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import io from "socket.io-client";

interface ChatMessage {
  _id?: string;
  roomId: string;
  senderId: string;
  message: string;
  createdAt?: string;
}

interface ReceiveMessageData {
  _id: string;
  roomId: string;
  senderId: string;
  message: string;
  createdAt?: string;
}

const DoctorChat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const { doctorId } = location.state as { doctorId?: string } || {};
  const userId = doctorId || "doctor";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const sendMessageRef = useRef<{ timestamp: number; roomId: string } | null>(null);

  // Initialize socket with proper cleanup
  useEffect(() => {
    const socket = io("https://doctorz-main.onrender.com", {
      transports: ["websocket"],
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Register user
  useEffect(() => {
    if (!userId || !socketRef.current) return;

    socketRef.current.emit("register", userId);

    return () => {
      socketRef.current?.emit("unregister", userId);
    };
  }, [userId]);

  // Handle room events
  useEffect(() => {
    if (!roomId || !socketRef.current) return;

    const socket = socketRef.current;

    const handleHistory = (history: ChatMessage[]) => {
      if (Array.isArray(history)) {
        setMessages(history);
      } else {
        setMessages([]);
      }
    };

    const handleReceive = (data: ReceiveMessageData) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: data._id,
          roomId: data.roomId,
          senderId: data.senderId,
          message: data.message,
          createdAt: data.createdAt || new Date().toISOString(),
        },
      ]);
    };

    const handleError = (err: any) => {
      console.error("Socket error:", err);
    };

    socket.on("history", handleHistory);
    socket.on("receiveMessage", handleReceive);
    socket.on("error", handleError);

    socket.emit("joinRoom", roomId);

    return () => {
      socket.off("history", handleHistory);
      socket.off("receiveMessage", handleReceive);
      socket.off("error", handleError);
      socket.emit("leaveRoom", roomId);
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!msg.trim() || !roomId || !socketRef.current) return;

    const now = Date.now();
    // Debounce duplicates (handles StrictMode double invokes)
    if (
      sendMessageRef.current?.roomId === roomId &&
      now - sendMessageRef.current.timestamp < 200
    ) {
      console.log("Message debounced (duplicate detected)");
      return;
    }

    sendMessageRef.current = { timestamp: now, roomId };

    const messageData = { roomId, senderId: userId, message: msg.trim() };

    // Optimistic UI update
    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId: userId,
      message: msg.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setMsg("");

    // Send to server
    socketRef.current.emit("sendMessage", messageData);
  }, [msg, roomId, userId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  if (!roomId) {
    return (
      <div className="h-full flex items-center justify-center border rounded max-w-lg mx-auto mt-4 shadow-lg bg-white">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Room Selected</h2>
          <p className="text-gray-600">Please select a patient conversation to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-[50%] mt-2 mx-auto flex flex-col rounded-lg bg-white">
      {/* Header */}
      <div className="p-4 font-bold border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between rounded-2xl">
        <div>
          <h1 className="text-lg">Chat with Patient</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-xs font-normal">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Room: {roomId.slice(-8)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={m._id ?? `msg-${i}`}
              className={`flex ${m.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md ${
                  m.senderId === userId
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="text-sm leading-relaxed">{m.message}</div>
                {m.createdAt && (
                  <div
                    className={`text-xs mt-2 ${
                      m.senderId === userId ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={handleKeyDown}
            maxLength={1000}
          />
          <button
            className={`px-6 py-3 rounded-2xl font-medium shadow-lg transition-all duration-200 ${
              msg.trim()
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={sendMessage}
            disabled={!msg.trim() || !isConnected}
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {msg.length}/1000
        </div>
      </div>
    </div>
  );
};

export default DoctorChat;
