import type { Card, ChordEvent } from './types'

const ch = (pad: string[], root: string, beats: number): ChordEvent => ({ pad, root, beats })

const MAJ_PENT = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']
const MAJ_PENT_LO = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4']
const MIN_PENT = ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'Eb5', 'F5']
const MIN_PENT_LO = ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'Eb4', 'F4']

export const CARDS: Card[] = [
  // ================= 节奏卡 ×12 =================
  {
    id: 'groove-house', name: 'House 四踩', slot: 'groove', rarity: 'N',
    flavor: '// 动次打次，永不过时',
    params: {
      bpm: 124, swing: 0,
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,2],
      perc:  [1,0,.5,0, 1,0,.5,0, 1,0,.5,0, 1,0,.5,.5],
      fill: { snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,.6,.8,1] },
    },
  },
  {
    id: 'groove-boombap', name: 'Boom Bap', slot: 'groove', rarity: 'N',
    flavor: '// 90 年代街头的心跳',
    params: {
      bpm: 90, swing: 0.1,
      kick:  [1,0,0,0, 0,0,0,.8, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,.3, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,.5,0],
      fill: { snare: [0,0,0,0, 1,0,0,.4, 0,0,.6,0, 1,.7,.8,1] },
    },
  },
  {
    id: 'groove-lofi', name: 'Lo-fi', slot: 'groove', rarity: 'N',
    flavor: '// 适合凌晨三点写代码',
    params: {
      bpm: 75, swing: 0.18,
      kick:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,.4],
      hat:   [1,0,.6,0, 1,0,.6,0, 1,0,.6,0, 1,0,.6,.6],
      perc:  [.3,0,.2,0, .3,0,.2,0, .3,0,.2,0, .3,0,.2,.2],
    },
  },
  {
    id: 'groove-rock', name: '摇滚', slot: 'groove', rarity: 'N',
    flavor: '//  guitars not included',
    params: {
      bpm: 120, swing: 0,
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      fill: { snare: [0,0,0,0, 1,0,0,0, .6,0,.7,0, 1,1,1,1] },
    },
  },
  {
    id: 'groove-disco', name: 'Disco', slot: 'groove', rarity: 'N',
    flavor: '// 反拍开镲，闪亮灯球',
    params: {
      bpm: 118, swing: 0,
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,2,0, 1,0,2,0, 1,0,2,0, 1,0,2,0],
      perc:  [0,0,.5,0, 0,0,.5,0, 0,0,.5,0, 0,0,.5,.5],
    },
  },
  {
    id: 'groove-reggaeton', name: 'Reggaeton', slot: 'groove', rarity: 'N',
    flavor: '// dembow 律动，一听就想晃',
    params: {
      bpm: 95, swing: 0,
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    },
  },
  {
    id: 'groove-trap', name: 'Trap', slot: 'groove', rarity: 'R',
    flavor: '// hi-hat 滚得像编译报错',
    params: {
      bpm: 140, swing: 0,
      kick:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,2],
      perc:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      fill: { hat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], snare: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,.7,.9] },
    },
  },
  {
    id: 'groove-breakbeat', name: 'Breakbeat', slot: 'groove', rarity: 'R',
    flavor: '// 碎拍一响，地板发烫',
    params: {
      bpm: 130, swing: 0,
      kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,.7],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [.4,0,0,.4, 0,.4,0,0, .4,0,0,.4, 0,.4,0,.4],
      fill: { snare: [0,0,0,0, 1,0,0,.5, 0,1,0,.6, 1,.8,1,1] },
    },
  },
  {
    id: 'groove-funk', name: 'Funk', slot: 'groove', rarity: 'R',
    flavor: '// ghost note 才是灵魂',
    params: {
      bpm: 105, swing: 0.08,
      kick:  [1,0,0,1, 0,0,1,0, 0,0,1,0, 0,.8,0,0],
      snare: [0,0,0,0, 1,0,.3,0, 0,.3,0,0, 1,0,.3,0],
      hat:   [1,.4,1,.4, 1,.4,1,.4, 1,.4,1,.4, 1,.4,1,.6],
      perc:  [0,0,.5,0, 0,0,0,.5, 0,0,.5,0, 0,0,0,0],
    },
  },
  {
    id: 'groove-techno', name: 'Techno', slot: 'groove', rarity: 'R',
    flavor: '// 柏林地下，四踩到底',
    params: {
      bpm: 130, swing: 0,
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,2,0, 0,0,2,0, 0,0,2,0, 0,0,2,0],
      perc:  [.4,0,0,0, .4,0,0,0, .4,0,0,0, .4,0,0,.5],
    },
  },
  {
    id: 'groove-synthwave', name: 'Synthwave', slot: 'groove', rarity: 'R',
    flavor: '// 霓虹迈阿密，合成器落日',
    params: {
      bpm: 100, swing: 0,
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,.8,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      perc:  [.25,0,.25,0, .25,0,.25,0, .25,0,.25,0, .25,0,.25,.25],
      fill: { snare: [0,0,0,0, 1,0,0,0, 0,0,0,.6, 1,0,1,0] },
    },
  },
  {
    id: 'groove-quantum', name: 'Quantum Groove', slot: 'groove', rarity: 'SSR',
    flavor: '// 3 对 4 复节奏，叠加态律动',
    params: {
      bpm: 138, swing: 0,
      kick:  [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,.4, 0,0,0,0, 1,0,.4,0],
      hat:   [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,2,0],
      perc:  [.5,0,.4,0, .5,0,.4,0, .5,0,.4,0, .5,.4,0,.4],
      fill: { snare: [0,0,0,0, 1,0,.5,0, 0,1,0,.6, 1,.8,1,1] },
    },
  },

  // ================= 和声卡 ×12 =================
  {
    id: 'harmony-canon', name: '卡农进行', slot: 'harmony', rarity: 'N',
    flavor: '// 帕赫贝尔点赞',
    params: {
      progression: [
        ch(['C3','E3','G3'], 'C2', 2), ch(['G2','B2','D3'], 'G1', 2),
        ch(['A2','C3','E3'], 'A1', 2), ch(['E3','G3','B3'], 'E2', 2),
        ch(['F3','A3','C4'], 'F2', 2), ch(['C3','E3','G3'], 'C2', 2),
        ch(['F3','A3','C4'], 'F2', 2), ch(['G2','B2','D3'], 'G1', 2),
      ],
      bassStyle: 'root', padOsc: 'triangle',
    },
  },
  {
    id: 'harmony-4536', name: '4536', slot: 'harmony', rarity: 'N',
    flavor: '// 流行音乐的 Hello World',
    params: {
      progression: [
        ch(['F3','A3','C4'], 'F2', 4), ch(['G2','B2','D3'], 'G1', 4),
        ch(['E3','G3','B3'], 'E2', 4), ch(['A2','C3','E3'], 'A1', 4),
      ],
      bassStyle: 'root', padOsc: 'triangle',
    },
  },
  {
    id: 'harmony-blues', name: '小调布鲁斯', slot: 'harmony', rarity: 'N',
    flavor: '// 忧郁是一种特性',
    params: {
      progression: [
        ch(['A2','C3','E3'], 'A1', 4), ch(['D3','F3','A3'], 'D2', 4),
        ch(['A2','C3','E3'], 'A1', 4), ch(['E3','G#3','D3'], 'E2', 4),
      ],
      bassStyle: 'pulse', padOsc: 'sawtooth',
    },
  },
  {
    id: 'harmony-drone', name: 'Drone 单音', slot: 'harmony', rarity: 'N',
    flavor: '// 极简主义，一个音也是歌',
    params: {
      progression: [ch(['C3','G3','C4'], 'C2', 16)],
      bassStyle: 'drone', padOsc: 'sine',
    },
  },
  {
    id: 'harmony-lofi7', name: 'Lo-fi 七和弦', slot: 'harmony', rarity: 'N',
    flavor: '// maj7 一响，困意登场',
    params: {
      progression: [
        ch(['C3','E3','G3','B3'], 'C2', 4), ch(['A2','C3','E3','G3'], 'A1', 4),
        ch(['F3','A3','C4','E4'], 'F2', 4), ch(['G2','B2','D3','F3'], 'G1', 4),
      ],
      bassStyle: 'root', padOsc: 'triangle',
    },
  },
  {
    id: 'harmony-sus', name: '挂留和弦悬浮', slot: 'harmony', rarity: 'N',
    flavor: '// 悬而不决，也是一种美',
    params: {
      progression: [
        ch(['C3','D3','G3'], 'C2', 4), ch(['C3','F3','G3'], 'C2', 4),
        ch(['G2','C3','D3'], 'G1', 4), ch(['G2','B2','D3'], 'G1', 4),
      ],
      bassStyle: 'pulse', padOsc: 'sine',
    },
  },
  {
    id: 'harmony-jazz251', name: '爵士 ii-V-I', slot: 'harmony', rarity: 'R',
    flavor: '// 9 音 13 音，全都安排上',
    params: {
      progression: [
        ch(['D3','F3','A3','E4'], 'D2', 4), ch(['G2','F3','B3','E4'], 'G2', 4),
        ch(['C3','E3','B3','D4'], 'C2', 8),
      ],
      bassStyle: 'pulse', padOsc: 'sine',
    },
  },
  {
    id: 'harmony-jpop', name: '日系王道进行', slot: 'harmony', rarity: 'R',
    flavor: '// 前奏一响，OP 登场',
    params: {
      progression: [
        ch(['F3','A3','C4'], 'F2', 4), ch(['G2','B2','D3'], 'G1', 4),
        ch(['E3','G3','B3'], 'E2', 4), ch(['A2','C3','E3'], 'A1', 4),
      ],
      bassStyle: 'pulse', padOsc: 'sawtooth',
    },
  },
  {
    id: 'harmony-dorian', name: '多利亚调式', slot: 'harmony', rarity: 'R',
    flavor: '// 明亮的小调，中世纪的酷',
    params: {
      progression: [
        ch(['C3','Eb3','G3','Bb3'], 'C2', 4), ch(['F3','A3','Eb4'], 'F2', 4),
        ch(['C3','Eb3','G3','Bb3'], 'C2', 4), ch(['G2','B2','F3'], 'G2', 4),
      ],
      bassStyle: 'root', padOsc: 'triangle',
    },
  },
  {
    id: 'harmony-epic', name: '史诗进行', slot: 'harmony', rarity: 'R',
    flavor: '// bVI-bVII-i，预告片标配',
    params: {
      progression: [
        ch(['Ab2','C3','Eb3'], 'Ab1', 4), ch(['Bb2','D3','F3'], 'Bb1', 4),
        ch(['C3','Eb3','G3'], 'C2', 8),
      ],
      bassStyle: 'pulse', padOsc: 'sawtooth',
    },
  },
  {
    id: 'harmony-walkbass', name: 'Walking Bass', slot: 'harmony', rarity: 'R',
    flavor: '// 贝斯在散步，别催它',
    params: {
      progression: [
        ch(['C3','E3','G3','Bb3'], 'C2', 4), ch(['A2','C#3','E3','G3'], 'A1', 4),
        ch(['D3','F3','A3','C4'], 'D2', 4), ch(['G2','B2','D3','F3'], 'G1', 4),
      ],
      bassStyle: 'walk', padOsc: 'sine',
    },
  },
  {
    id: 'harmony-golden', name: 'Golden Ratio 黄金分割', slot: 'harmony', rarity: 'SSR',
    flavor: '// 斐波那契写进和声里',
    params: {
      progression: [
        ch(['C3','G3','D4','A4'], 'C2', 5),
        ch(['F3','C4','G4'], 'F2', 3),
        ch(['A2','E3','G3','D4'], 'A1', 8),
      ],
      bassStyle: 'root', padOsc: 'sine',
    },
  },

  // ================= 音色卡 ×12 =================
  {
    id: 'timbre-8bit', name: '8-bit 方波', slot: 'timbre', rarity: 'N',
    flavor: '// 红白机开机音',
    params: {
      leadOsc: 'square', scale: MAJ_PENT,
      motif: [0,-1,2,-1, 4,-1,3,-1, 5,-1,4,2, -1,0,-1,-1],
      arpMode: 'up', arpRate: '16n',
    },
  },
  {
    id: 'timbre-piano', name: '钢琴', slot: 'timbre', rarity: 'N',
    flavor: '// 最不会出错的选项',
    params: {
      leadOsc: 'triangle', scale: MAJ_PENT,
      motif: [0,-1,-1,2, -1,-1,4,-1, 3,-1,-1,2, -1,1,-1,-1],
      arpMode: 'updown', arpRate: '8n',
    },
  },
  {
    id: 'timbre-pluck', name: '锯齿 Pluck', slot: 'timbre', rarity: 'N',
    flavor: '// EDM 标配，嘣嘣脆',
    params: {
      leadOsc: 'sawtooth', scale: MAJ_PENT,
      motif: [0,0,-1,0, 2,-1,4,-1, 0,0,-1,2, -1,4,-1,5],
      arpMode: 'up', arpRate: '16n',
    },
  },
  {
    id: 'timbre-strings', name: '弦乐 Pad', slot: 'timbre', rarity: 'N',
    flavor: '// 慢起音，情绪拉满',
    params: {
      leadOsc: 'strings', scale: MAJ_PENT,
      motif: [4,-1,-1,-1, 3,-1,-1,-1, 2,-1,-1,-1, 1,-1,-1,0],
      arpMode: 'up', arpRate: '8n',
    },
  },
  {
    id: 'timbre-tri', name: '芯片三角波', slot: 'timbre', rarity: 'N',
    flavor: '// 红白机贝斯的味道',
    params: {
      leadOsc: 'triangle', scale: MAJ_PENT_LO,
      motif: [0,-1,0,-1, 1,-1,0,-1, 2,-1,0,-1, 1,-1,0,1],
      arpMode: 'down', arpRate: '16n',
    },
  },
  {
    id: 'timbre-acid', name: 'Acid 303', slot: 'timbre', rarity: 'N',
    flavor: '// 酸性滑音，大脑按摩',
    params: {
      leadOsc: 'acid', scale: MIN_PENT_LO,
      motif: [0,-1,0,1, -1,0,-1,3, 0,-1,0,1, -1,2,-1,1],
      arpMode: 'up', arpRate: '16n',
    },
  },
  {
    id: 'timbre-fm', name: 'FM 铃音', slot: 'timbre', rarity: 'R',
    flavor: '// 玻璃质感，清脆到耳鸣',
    params: {
      leadOsc: 'fm', scale: MAJ_PENT,
      motif: [4,-1,-1,5, -1,-1,4,-1, 2,-1,-1,4, -1,-1,2,-1],
      arpMode: 'updown', arpRate: '8n',
    },
  },
  {
    id: 'timbre-vox', name: '人声切片', slot: 'timbre', rarity: 'R',
    flavor: '// eh-eh-eh，切片三连',
    params: {
      leadOsc: 'vox', scale: MAJ_PENT,
      motif: [0,0,-1,0, -1,2,2,-1, 4,-1,4,-1, 2,2,-1,-1],
      arpMode: 'off', arpRate: '8n',
    },
  },
  {
    id: 'timbre-organ', name: '风琴 Organ', slot: 'timbre', rarity: 'R',
    flavor: '// 复古摇滚的老伙计',
    params: {
      leadOsc: 'organ', scale: MAJ_PENT,
      motif: [0,-1,2,4, -1,-1,3,-1, 4,-1,2,-1, 0,-1,-1,-1],
      arpMode: 'down', arpRate: '8n',
    },
  },
  {
    id: 'timbre-vibra', name: '颤音琴', slot: 'timbre', rarity: 'R',
    flavor: '// 爵士酒吧的点缀',
    params: {
      leadOsc: 'vibra', scale: MAJ_PENT,
      motif: [5,-1,-1,-1, 4,-1,2,-1, -1,-1,3,-1, -1,2,-1,-1],
      arpMode: 'updown', arpRate: '8n',
    },
  },
  {
    id: 'timbre-power', name: 'Power Chord 失真吉他', slot: 'timbre', rarity: 'R',
    flavor: '// 强力和弦，音量即正义',
    params: {
      leadOsc: 'dist', scale: MIN_PENT_LO, distort: 0.7,
      motif: [0,0,-1,-1, 1,1,-1,-1, 0,0,-1,3, -1,-1,1,-1],
      arpMode: 'off', arpRate: '8n',
    },
  },
  {
    id: 'timbre-golden-chip', name: 'Golden Chiptune 金色芯片', slot: 'timbre', rarity: 'SSR',
    flavor: '// 黄金音色，自带圣光',
    params: {
      leadOsc: 'gold', scale: MAJ_PENT,
      motif: [4,-1,5,-1, 7,-1,5,4, 2,-1,4,-1, 5,-1,-1,-1],
      arpMode: 'updown', arpRate: '16n',
    },
  },

  // ================= 彩蛋卡 ×6 =================
  {
    id: 'egg-rmrf', name: 'rm -rf /', slot: 'easter', rarity: 'SR',
    flavor: '// 删掉一轨，世界清净了（再抽恢复）',
    effect: 'rm-rf',
  },
  {
    id: 'egg-copy', name: 'Ctrl+C / Ctrl+V', slot: 'easter', rarity: 'SR',
    flavor: '// 这一轨写得不错，现在它是另一轨的了',
    effect: 'copy-paste',
  },
  {
    id: 'egg-stackoverflow', name: 'Stack Overflow', slot: 'easter', rarity: 'SSR',
    flavor: '// 栈溢出！音量也溢出！',
    effect: 'stack-overflow',
  },
  {
    id: 'egg-404', name: '404 Not Found', slot: 'easter', rarity: 'SR',
    flavor: '// 鼓点不存在，它从未存在过',
    effect: 'not-found',
  },
  {
    id: 'egg-hello', name: 'Hello, World', slot: 'easter', rarity: 'SR',
    flavor: '// 每个程序员的第一声啼哭',
    effect: 'hello-world',
  },
  {
    id: 'egg-sudo', name: 'sudo make beat', slot: 'easter', rarity: 'SSR',
    flavor: '// 获得 root 权限，音量拉满',
    effect: 'sudo',
  },
]
