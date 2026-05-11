import { io } from 'socket.io-client';

// 같은 서버에서 서빙될 때 자동으로 origin 맞춤
const socket = io({ autoConnect: true });
export default socket;
