<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal terminal-modal">
      <div class="modal-header">
        <div class="header-title">
          <TerminalIcon class="icon" :size="20" />
          <h3>Terminal: {{ podName }}</h3>
        </div>
        <div class="modal-actions">
          <select v-model="selectedContainer" class="container-select" :disabled="connected" @change="reconnect">
            <option v-for="c in containers" :key="c.name" :value="c.name">
              {{ c.name }}
            </option>
          </select>
          <div class="status-indicator" :class="{ connected: connected }">
            <div class="status-dot"></div>
            {{ connected ? 'Connected' : 'Disconnected' }}
          </div>
          <button class="close-btn" @click="close">
            <X :size="20" />
          </button>
        </div>
      </div>
      <div class="modal-content terminal-wrapper">
        <div v-if="loading" class="loading-overlay">
          Connecting to container...
        </div>
        <div ref="terminalRef" class="xterm-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'
import { Terminal as TerminalIcon, X } from 'lucide-vue-next'
import { k8sAPI, type ContainerInfo } from '../api/k8s'

const props = defineProps<{
  visible: boolean
  podName: string
  namespace: string
}>()

const emit = defineEmits(['update:visible'])

const terminalRef = ref<HTMLElement | null>(null)
const containers = ref<ContainerInfo[]>([])
const selectedContainer = ref('')
const connected = ref(false)
const loading = ref(false)

let term: Terminal | null = null
let fitAddon: FitAddon | null = null
let ws: WebSocket | null = null
let resizeObserver: ResizeObserver | null = null

// 当显示状态变化
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    loading.value = true
    await loadContainers()
    await nextTick()
    initTerminal()
  } else {
    destroyTerminal()
  }
})

async function loadContainers() {
  if (!props.podName || !props.namespace) return
  try {
    const res = await k8sAPI.getPodContainers(props.namespace, props.podName)
    containers.value = res.data?.data || []
    if (containers.value.length > 0) {
      selectedContainer.value = containers.value[0].name
    }
  } catch (e) {
    console.error('Failed to get containers:', e)
  }
}

function initTerminal() {
  if (!terminalRef.value) return

  term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 14,
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4'
    }
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  
  term.open(terminalRef.value)
  fitAddon.fit()

  term.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ operation: 'stdin', data }))
    }
  })

  // 监听容器大小改变进行重置大小
  resizeObserver = new ResizeObserver(() => {
    if (term && fitAddon) {
      fitAddon.fit()
      sendResizeMsg()
    }
  })
  resizeObserver.observe(terminalRef.value)

  connectWebSocket()
}

function connectWebSocket() {
  if (ws) {
    ws.close()
  }
  
  if (!selectedContainer.value) return

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'
  const wsUrl = baseURL.replace(/^http/, 'ws') + '/api/k8s/ws/terminal'
  const url = new URL(wsUrl)
  url.searchParams.append('namespace', props.namespace)
  url.searchParams.append('pod', props.podName)
  url.searchParams.append('container', selectedContainer.value)
  
  const token = localStorage.getItem('token')
  const protocols = token ? ['Bearer', token] : []

  ws = new WebSocket(url.toString(), protocols)

  ws.onopen = () => {
    connected.value = true
    loading.value = false
    sendResizeMsg()
  }

  ws.onmessage = (event) => {
    if (term) {
      term.write(event.data)
    }
  }

  ws.onclose = () => {
    connected.value = false
    loading.value = false
    if (term) {
      term.write('\r\n\x1b[31m[WebSocket connection closed]\x1b[0m\r\n')
    }
  }

  ws.onerror = () => {
    connected.value = false
    loading.value = false
    if (term) {
      term.write('\r\n\x1b[31m[WebSocket connection error]\x1b[0m\r\n')
    }
  }
}

function sendResizeMsg() {
  if (ws && ws.readyState === WebSocket.OPEN && term) {
    ws.send(JSON.stringify({
      operation: 'resize',
      cols: term.cols,
      rows: term.rows
    }))
  }
}

function reconnect() {
  if (term) {
    term.reset()
  }
  loading.value = true
  connectWebSocket()
}

function close() {
  emit('update:visible', false)
}

function destroyTerminal() {
  if (ws) {
    ws.close()
    ws = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (term) {
    term.dispose()
    term = null
  }
  connected.value = false
}

onUnmounted(() => {
  destroyTerminal()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.terminal-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #0f172a;
}

.header-title .icon {
  color: #4f46e5;
}

.header-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.container-select {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
  background: white;
  outline: none;
  min-width: 150px;
}

.container-select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 100px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status-indicator.connected {
  color: #059669;
  background: #ecfdf5;
}

.status-indicator.connected .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.terminal-wrapper {
  flex: 1;
  padding: 12px;
  background: #1e1e1e;
  position: relative;
  display: flex;
  flex-direction: column;
}

.xterm-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(30, 30, 30, 0.8);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 14px;
  z-index: 10;
  border-radius: 0 0 12px 12px;
}
</style>
