const API_LATENCY = 450;

export async function simulateLatency(ms = API_LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateUUID() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}
