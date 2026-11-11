<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { explorerItemsEn, explorerItemsZh, type TemplateCategory } from '../../data/catalog'

type TabKey = 'all' | TemplateCategory

interface Tab { k: TabKey; t: string }

const tabsZh: Tab[] = [
  { k: 'all', t: '全部 31' },
  { k: 'common', t: '🗺️ 经典 / 通用' },
  { k: 'ai', t: '🤖 AI 原生' },
  { k: 'agent', t: '🦾 编码 / 自治 Agent' },
  { k: 'prompt', t: '📜 系统提示词' },
  { k: 'industrial', t: '🏭 工业 / 嵌入式' },
]

const tabsEn: Tab[] = [
  { k: 'all', t: 'All 31' },
  { k: 'common', t: '🗺️ Classic / General' },
  { k: 'ai', t: '🤖 AI-native' },
  { k: 'agent', t: '🦾 Coding / Autonomous Agents' },
  { k: 'prompt', t: '📜 System Prompts' },
  { k: 'industrial', t: '🏭 Industrial / Embedded' },
]

const { lang } = useData()
const isEn = computed(() => lang.value === 'en')
const items = computed(() => (isEn.value ? explorerItemsEn : explorerItemsZh))
const tabs = computed(() => (isEn.value ? tabsEn : tabsZh))
const generalLabel = computed(() => (isEn.value ? 'General' : '通用'))

const filter = ref<TabKey>('all')
const filtered = computed(() => (filter.value === 'all' ? items.value : items.value.filter((i) => i.cat === filter.value)))
</script>

<template>
  <div class="ax">
    <div class="ax-tabs">
      <button
        v-for="tb in tabs"
        :key="tb.k"
        :class="['ax-tab', filter === tb.k ? 'active' : '']"
        @click="filter = tb.k"
      >{{ tb.t }}</button>
    </div>
    <div class="ax-grid">
      <a v-for="it in filtered" :key="it.link" class="ax-card" :href="withBase(it.link)">
        <div class="ax-ic">{{ it.icon }}</div>
        <div class="ax-name">{{ it.name }}</div>
        <div class="ax-desc">{{ it.desc }}</div>
        <span class="ax-tag" :class="it.cat">{{ it.cat === 'ai' ? 'AI' : it.cat === 'agent' ? 'Agent' : it.cat === 'prompt' ? 'Prompt' : it.cat === 'industrial' ? (isEn ? 'Industrial' : '工业') : generalLabel }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.ax { max-width: 1152px; margin: 0 auto; padding: 0 24px; }
.ax-tabs { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 8px 0 28px; }
.ax-tab {
  padding: 7px 20px; border: 1px solid var(--vp-c-divider); border-radius: 20px;
  background: var(--vp-c-bg); cursor: pointer; font-size: 14px; color: var(--vp-c-text-1); transition: 0.2s;
}
.ax-tab:hover { border-color: var(--vp-c-brand-1); }
.ax-tab.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.ax-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.ax-card {
  position: relative; display: block; padding: 18px;
  border: 1px solid var(--vp-c-divider); border-radius: 12px;
  background: var(--vp-c-bg-soft); text-decoration: none; color: inherit; transition: 0.2s;
}
.ax-card:hover { border-color: var(--vp-c-brand-1); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
.ax-ic { font-size: 28px; margin-bottom: 8px; }
.ax-name { font-weight: 600; color: var(--vp-c-text-1); margin-bottom: 6px; }
.ax-desc { font-size: 13px; color: var(--vp-c-text-2); line-height: 1.5; }
.ax-tag {
  position: absolute; top: 14px; right: 14px; font-size: 11px;
  padding: 2px 8px; border-radius: 10px; background: var(--vp-c-default-soft); color: var(--vp-c-text-2);
}
.ax-tag.ai { background: rgba(60, 135, 114, 0.16); color: var(--vp-c-brand-1); }
.ax-tag.agent { background: rgba(200, 134, 13, 0.16); color: #b9770e; }
.ax-tag.prompt { background: rgba(88, 101, 242, 0.16); color: #5865f2; }
.ax-tag.industrial { background: rgba(96, 108, 220, 0.14); color: #5b6bce; }
</style>
