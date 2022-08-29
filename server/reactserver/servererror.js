class ServerError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "ServerError";
        this.code = code;
      }
}

module.exports = ServerError;