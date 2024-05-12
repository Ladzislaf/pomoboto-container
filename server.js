import http from 'http';

const PORT = process.env.PORT || 10000;

class Server {
	constructor() {
		this.server = http.createServer((req, res) => {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('Pong.');
		});
	}
	start() {
		this.server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}.`);
		});
	}
}

export default new Server();
