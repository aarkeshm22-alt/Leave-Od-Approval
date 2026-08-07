// src/utils/eventBus.js
const eventBus = {
  listeners: {},
  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  },
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => {
      this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);
    };
  }
};
export default eventBus;