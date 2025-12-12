import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('/', {
  transports: ['websocket'], // explicit setup
});

const TokenView = () => {
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [formData, setFormData] = useState({ userName: '', rollNo: '' });
  const [myToken, setMyToken] = useState(null);
  const [position, setPosition] = useState(null);
  const [notification, setNotification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch queues on load
  useEffect(() => {
    axios.get('/api/queues').then(res => setQueues(res.data));
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!myToken) return;

    socket.on('queue_updated', (data) => {
      if (data.queueId === myToken.queueId._id || data.queueId === myToken.queueId) {
        refreshStatus();
      }
    });

    socket.on('token_called', (data) => {
      if (data.tokenId === myToken._id) {
        setNotification(`It's your turn! Go to ${data.queueName}`);
         const audio = new Audio('/beep.mp3'); 
         audio.play().catch(e => console.log('Audio play failed', e));
      }
    });

    return () => {
      socket.off('queue_updated');
      socket.off('token_called');
    };
  }, [myToken]);

  const refreshStatus = async () => {
    if (!myToken) return;
    try {
      const res = await axios.get(`/api/token/${myToken._id}`);
      setMyToken(res.data.token);
      setPosition(res.data.position);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQueueSelect = (queue) => {
    setSelectedQueue(queue);
    setErrorMsg('');
  };

  const generateToken = async () => {
    if (!selectedQueue) return;
    setErrorMsg('');
    try {
      const res = await axios.post('/api/token/generate', {
        queueId: selectedQueue._id,
        userName: formData.userName,
        rollNo: formData.rollNo
      });
      setMyToken(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error generating token');
    }
  };

  if (myToken) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Your Token</h2>
        <div className="text-6xl font-extrabold text-blue-600 mb-4">
          {myToken.displayToken}
        </div>
        
        {notification && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg animate-pulse font-bold">
            {notification}
          </div>
        )}

        <div className="text-gray-600 mb-2">
          Status: <span className="uppercase font-semibold">{myToken.status}</span>
        </div>
        
        {myToken.status === 'waiting' && (
           <div className="mt-4 p-4 bg-gray-50 rounded">
             <p className="text-xl">People ahead of you:</p>
             <p className="text-4xl font-bold text-gray-800">{position}</p>
             <p className="text-sm text-gray-500 mt-2">Est. Wait: {position * 5} mins</p>
           </div>
        )}
         {myToken.status === 'expired' && (
           <div className="mt-4 p-4 bg-red-50 text-red-800 rounded">
             <p className="text-xl font-bold">Token Expired</p>
             <p>Please rejoin the queue.</p>
             <button onClick={() => setMyToken(null)} className="mt-2 underline">Go Back</button>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Join Queue</h1>
      
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {errorMsg}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">Select Facility</label>
        
        {/* Scrollable List for Facilities */}
        <div className="h-48 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2">
          {queues.map(q => (
            <div
              key={q._id}
              onClick={() => handleQueueSelect(q)}
              className={`p-3 rounded cursor-pointer border transition ${
                selectedQueue?._id === q._id 
                  ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-500' 
                  : 'bg-white border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">{q.name}</span>
                <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">{q.category}</span>
              </div>
              {q.category === 'standard' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Open 8:00 AM - {q.name === 'Canteen' ? '8:00 PM' : '5:00 PM'}
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
            <label className="block text-gray-700 mb-1 text-sm font-bold">Full Name</label>
            <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="John Doe"
            value={formData.userName}
            onChange={e => setFormData({...formData, userName: e.target.value})}
            />
        </div>
        <div>
            <label className="block text-gray-700 mb-1 text-sm font-bold">Roll Number</label>
            <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="123456"
            value={formData.rollNo}
            onChange={e => setFormData({...formData, rollNo: e.target.value})}
            />
        </div>
      </div>

      <button
        onClick={generateToken}
        disabled={!selectedQueue || !formData.userName || !formData.rollNo}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
      >
        Get Token
      </button>
    </div>
  );
};

export default TokenView;
