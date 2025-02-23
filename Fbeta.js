// flow.js
import io from 'https://cdn.socket.io/4.3.1/socket.io.js';

/**
 * Classe Flow para gerenciar conexões Socket.IO no cliente.
 */
export default class Flow {
  /**
   * Construtor da classe Flow.
   * @param {string} url - URL do servidor Socket.IO.
   * @param {Object} [options={}] - Opções adicionais para configurar o socket.
   */
  constructor(url = 'http://localhost:3000', options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.eventListeners = {
      connect: [],
      disconnect: [],
      error: [],
    };
    this.token = null;
  }

  /**
   * Conecta ao servidor Socket.IO com um token opcional.
   * @param {string} [token=null] - Token JWT para autenticação.
   */
  connect(token = null) {
    if (token) {
      this.token = token;
      this.url = this.appendTokenToURL(this.url, token);
    }

    this.socket = io(this.url, this.options);

    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', () => this.handleDisconnect());
    this.socket.on('error', (error) => this.handleError(error));
    this.socket.on('connect_error', (error) => this.handleConnectError(error));
  }

  /**
   * Desconecta do servidor Socket.IO.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.clearEventListeners();
    }
  }

  /**
   * Envia uma mensagem para o servidor Socket.IO.
   * @param {string} event - Nome do evento.
   * @param {any} data - Dados a serem enviados.
   */
  send(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Registra um callback para lidar com eventos recebidos do servidor.
   * @param {string} event - Nome do evento.
   * @param {Function} callback - Callback para lidar com os dados recebidos.
   */
  receive(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Registra um callback para um evento específico.
   * @param {string} event - Nome do evento.
   * @param {Function} callback - Callback a ser chamado quando o evento ocorrer.
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  /**
   * Remove um callback específico de um evento.
   * @param {string} event - Nome do evento.
   * @param {Function} callback - Callback a ser removido.
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Manipula o evento de conexão bem-sucedida.
   */
  handleConnect() {
    console.log('Connected to server');
    this.triggerEvent('connect');
  }

  /**
   * Manipula o evento de desconexão do servidor.
   */
  handleDisconnect() {
    console.log('Disconnected from server');
    this.triggerEvent('disconnect');
  }

  /**
   * Manipula o evento de erro de conexão.
   * @param {Error} error - Objeto de erro recebido.
   */
  handleError(error) {
    console.error('Connection error:', error);
    this.triggerEvent('error', error);
  }

  /**
   * Manipula o evento de erro de conexão e tenta reconectar após um intervalo.
   * @param {Error} error - Objeto de erro recebido.
   */
  handleConnectError(error) {
    console.error('Connection error, attempting to reconnect:', error);
    setTimeout(() => {
      this.connect(this.token);
    }, 3000); // Tentar reconectar após 3 segundos
  }

  /**
   * Dispara um evento para todos os callbacks registrados para esse evento.
   * @param {string} event - Nome do evento a ser disparado.
   * @param  {...any} args - Argumentos a serem passados para os callbacks.
   */
  triggerEvent(event, ...args) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  /**
   * Adiciona um token JWT à URL fornecida.
   * @param {string} url - URL original.
   * @param {string} token - Token JWT a ser adicionado.
   * @returns {string} - URL modificada com o token JWT.
   */
  appendTokenToURL(url, token) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  }

  /**
   * Limpa todos os listeners de eventos registrados.
   */
  clearEventListeners() {
    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event] = [];
    });
  }

  /**
   * Define novas opções para o socket e reconecta com as novas opções.
   * @param {Object} options - Novas opções a serem configuradas para o socket.
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };

    if (this.socket) {
      this.socket.disconnect();
      this.connect(this.token);
    }
  }
}

export default Flow;
