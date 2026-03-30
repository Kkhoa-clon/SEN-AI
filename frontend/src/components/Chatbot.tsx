import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import ReplayIcon from '@mui/icons-material/Replay'
import AddIcon from '@mui/icons-material/Add'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: number
  model?: string
  isError?: boolean
}

type Conversation = {
  id: string
  title: string
  messages: Message[]
  memoryNotes: string[]
  updatedAt: number
}

type PromptTemplate = {
  id: string
  name: string
  content: string
}

type Settings = {
  model: string
  secondaryModel: string
  compareMode: boolean
  temperature: number
  systemPrompt: string
}

type Telemetry = {
  totalPrompts: number
  successResponses: number
  errorResponses: number
  abortedResponses: number
  totalResponseMs: number
  helpfulVotes: number
  unhelpfulVotes: number
}

type QuestionType = 'multiple_choice' | 'true_false'

type QuizQuestion = {
  id: string
  type: QuestionType
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'de' | 'trung_binh' | 'kho'
  points: number
}

type QuizPayload = {
  title: string
  questions: QuizQuestion[]
}

type AssessmentSession = {
  title: string
  questions: QuizQuestion[]
  answers: Record<string, string>
  startedAt: number
  durationMs?: number
  submitted: boolean
  score: number
  totalPoints: number
  correctCount: number
  wrongQuestionTitles: string[]
  analysis: string
}

type MindmapNode = {
  title: string
  children?: MindmapNode[]
}

const OLLAMA_BASE_URL = 'http://localhost:11434'
const LS_CONVERSATIONS_KEY = 'chatbot_v3_conversations'
const LS_ACTIVE_ID_KEY = 'chatbot_v3_active_id'
const LS_SETTINGS_KEY = 'chatbot_v3_settings'
const LS_TELEMETRY_KEY = 'chatbot_v3_telemetry'
const LS_TEMPLATES_KEY = 'chatbot_v3_templates'

const QUICK_ACTIONS = [
  { label: 'Tóm tắt', prefix: 'Hãy tóm tắt nội dung sau thật ngắn gọn:\n\n' },
  { label: 'Viết lại chuyên nghiệp', prefix: 'Hãy viết lại nội dung sau theo giọng văn chuyên nghiệp:\n\n' },
  { label: 'Tạo checklist', prefix: 'Hãy tạo checklist hành động từ nội dung sau:\n\n' },
  { label: 'Giải thích đơn giản', prefix: 'Hãy giải thích nội dung sau cho người mới bắt đầu:\n\n' },
]

const ONBOARDING_PROMPTS = [
  'Tóm tắt đoạn văn sau thành 5 ý chính.',
  'Giải thích đoạn code này cho người mới học.',
  'Lập kế hoạch học 7 ngày cho chủ đề React.',
  'Viết email lịch sự và chuyên nghiệp.',
  'Cho mình checklist để ôn thi hiệu quả.',
]

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const DANGEROUS_SOLVE_ALL_PATTERN = /(lam ho|làm hộ|giai hoan toan|giải hoàn toàn|cho dap an ngay|cho đáp án ngay|khong can giai thich|không cần giải thích|lam het bai|làm hết bài)/i

const toJsonFromModel = <T,>(rawText: string): T => {
  const sanitized = rawText.trim().replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
  return JSON.parse(sanitized) as T
}

const getDefaultPointsByDifficulty = (difficulty: 'de' | 'trung_binh' | 'kho') => {
  if (difficulty === 'de') return 1
  if (difficulty === 'trung_binh') return 2
  return 3
}

const getInitialBotMessage = (): Message => ({
  id: uid(),
  text: 'Xin chào! Tôi là Bé Sen AI. Bạn cần mình hỗ trợ gì hôm nay?',
  sender: 'bot',
  timestamp: Date.now(),
})

const getNewConversation = (): Conversation => ({
  id: uid(),
  title: 'Cuộc trò chuyện mới',
  messages: [getInitialBotMessage()],
  memoryNotes: [],
  updatedAt: Date.now(),
})

const getDefaultTemplates = (): PromptTemplate[] => [
  { id: uid(), name: 'Email lịch sự', content: 'Viết email lịch sự cho tình huống sau:' },
  { id: uid(), name: 'Tóm tắt tài liệu', content: 'Tóm tắt tài liệu sau thành các ý chính:' },
]

const friendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lowered = message.toLowerCase()

  if (lowered.includes('failed to fetch') || lowered.includes('network') || lowered.includes('cors')) {
    return 'Không kết nối được Ollama. Hãy mở Ollama và kiểm tra cổng 11434.'
  }
  if (lowered.includes('404') || lowered.includes('model')) {
    return 'Model chưa tồn tại hoặc chưa tải. Hãy chọn model khác hoặc pull model trong Ollama.'
  }
  if (lowered.includes('aborted')) {
    return 'Đã dừng sinh nội dung.'
  }
  return 'Đang có lỗi khi xử lý. Hãy thử lại sau ít phút.'
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [expanded, setExpanded] = useState(false)
  const lines = value.split('\n')
  const isLong = lines.length > 20
  const codeToShow = isLong && !expanded ? lines.slice(0, 20).join('\n') : value

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>{language || 'code'}</Typography>
        <Stack direction="row" spacing={0.5}>
          {isLong && <Button size="small" onClick={() => setExpanded((prev) => !prev)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Button>}
          <Button size="small" onClick={() => navigator.clipboard.writeText(value)}>Sao chép mã</Button>
        </Stack>
      </Stack>
      <SyntaxHighlighter style={materialDark} language={language}>{codeToShow}</SyntaxHighlighter>
    </Box>
  )
}

const MessageContent = ({ content, sender }: { content: string; sender: 'user' | 'bot' }) => (
  <ReactMarkdown
    components={{
      code({ className, children }: any) {
        const match = /language-(\w+)/.exec(className || '')
        const value = String(children).replace(/\n$/, '')
        return match
          ? <CodeBlock language={match[1]} value={value} />
          : <code style={{ backgroundColor: sender === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(30,59,112,0.1)', padding: '2px 6px', borderRadius: 4 }}>{children}</code>
      },
      p: ({ children }) => <Typography sx={{ mb: 1 }}>{children}</Typography>,
      li: ({ children }) => <Typography component="li" sx={{ mb: 0.5 }}>{children}</Typography>,
    }}
  >
    {content}
  </ReactMarkdown>
)

function ChatbotComponent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [renameInput, setRenameInput] = useState('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [errorHint, setErrorHint] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [learningModeOpen, setLearningModeOpen] = useState(true)
  const [explainLevel, setExplainLevel] = useState<'simple' | 'textbook' | 'advanced'>('simple')
  const [antiDependencyEnabled, setAntiDependencyEnabled] = useState(true)
  const [assessmentMode, setAssessmentMode] = useState(false)
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(6)
  const [assessmentDifficulty, setAssessmentDifficulty] = useState<'de' | 'trung_binh' | 'kho'>('trung_binh')
  const [assessmentSession, setAssessmentSession] = useState<AssessmentSession | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)
  const [mindmapLoading, setMindmapLoading] = useState(false)
  const [mindmapData, setMindmapData] = useState<MindmapNode | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([getNewConversation()])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [templates, setTemplates] = useState<PromptTemplate[]>(getDefaultTemplates())
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState<Settings>({
    model: 'qwen2.5-coder:7b',
    secondaryModel: 'qwen2.5-coder:7b',
    compareMode: false,
    temperature: 0.7,
    systemPrompt: 'Bạn là trợ lý hữu ích, trả lời ngắn gọn, dễ hiểu và chính xác.',
  })

  const [telemetry, setTelemetry] = useState<Telemetry>({
    totalPrompts: 0,
    successResponses: 0,
    errorResponses: 0,
    abortedResponses: 0,
    totalResponseMs: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  })

  const requestControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width:900px)')
  const isWideDesktop = useMediaQuery('(min-width:1280px)')

  useEffect(() => {
    if (!assessmentSession?.durationMs || assessmentSession.submitted) return
    const tick = () => {
      const remaining = Math.max(assessmentSession.startedAt + assessmentSession.durationMs - Date.now(), 0)
      setTimeLeftMs(remaining)
      if (remaining === 0) {
        void submitAssessment()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [assessmentSession])

  useEffect(() => {
    if (isMobile) setLearningModeOpen(false)
  }, [isMobile])

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? conversations[0],
    [conversations, activeConversationId],
  )

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CONVERSATIONS_KEY)
      const a = localStorage.getItem(LS_ACTIVE_ID_KEY)
      const s = localStorage.getItem(LS_SETTINGS_KEY)
      const t = localStorage.getItem(LS_TELEMETRY_KEY)
      const p = localStorage.getItem(LS_TEMPLATES_KEY)
      if (c) setConversations(JSON.parse(c) as Conversation[])
      if (a) setActiveConversationId(a)
      if (s) setSettings(JSON.parse(s) as Settings)
      if (t) setTelemetry(JSON.parse(t) as Telemetry)
      if (p) setTemplates(JSON.parse(p) as PromptTemplate[])
    } catch {
      // ignore local data error
    }
  }, [])

  useEffect(() => { localStorage.setItem(LS_CONVERSATIONS_KEY, JSON.stringify(conversations)) }, [conversations])
  useEffect(() => { if (activeConversationId) localStorage.setItem(LS_ACTIVE_ID_KEY, activeConversationId) }, [activeConversationId])
  useEffect(() => { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(LS_TELEMETRY_KEY, JSON.stringify(telemetry)) }, [telemetry])
  useEffect(() => { localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(templates)) }, [templates])
  useEffect(() => { if (!activeConversationId && conversations.length) setActiveConversationId(conversations[0].id) }, [activeConversationId, conversations])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConversation?.messages])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
        const data = await response.json()
        const models = (data.models || []).map((m: { name: string }) => m.name)
        setAvailableModels(models)
      } catch {
        setErrorHint('Không lấy được danh sách model. Kiểm tra Ollama đang chạy.')
      }
    }
    void fetchModels()
  }, [])

  const updateConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((item) => (item.id === conversationId ? updater(item) : item)))
  }

  const saveConversationMemory = (conversationId: string, text: string) => {
    const clipped = text.replace(/\s+/g, ' ').trim().slice(0, 180)
    if (!clipped) return
    updateConversation(conversationId, (cv) => ({
      ...cv,
      memoryNotes: [...new Set([clipped, ...cv.memoryNotes])].slice(0, 30),
      updatedAt: Date.now(),
    }))
  }

  const buildPromptContext = (conversation: Conversation) => {
    const memoryBlock = conversation.memoryNotes.length
      ? `\n\n---\nBộ nhớ ngữ cảnh đã lưu (riêng hội thoại này):\n- ${conversation.memoryNotes.join('\n- ')}`
      : ''

    return [{ role: 'system', content: `${settings.systemPrompt}${memoryBlock}` }]
  }

  const streamReply = async (conversationId: string, model: string, sourceMessages: Message[], memoryNotes: string[], label?: string) => {

    const start = Date.now()
    const botId = uid()
    updateConversation(conversationId, (cv) => ({
      ...cv,
      messages: [...cv.messages, { id: botId, text: '', sender: 'bot', timestamp: Date.now(), model }],
      updatedAt: Date.now(),
    }))

    const memoryBlock = memoryNotes.length ? `\n\n---\nBộ nhớ ngữ cảnh đã lưu (riêng hội thoại này):\n- ${memoryNotes.join('\n- ')}` : ''
    const ollamaMessages = [
      { role: 'system', content: `${settings.systemPrompt}${memoryBlock}` },
      ...sourceMessages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
    ]

    const controller = new AbortController()
    requestControllerRef.current = controller

    let streamed = ''
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ model, messages: ollamaMessages, stream: true, options: { temperature: settings.temperature } }),
      })

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n')
        buffer = chunks.pop() ?? ''

        for (const line of chunks) {
          if (!line.trim()) continue
          const chunk = JSON.parse(line) as { message?: { content?: string } }
          const token = chunk.message?.content ?? ''
          if (!token) continue
          streamed += token
          updateConversation(conversationId, (cv) => ({
            ...cv,
            messages: cv.messages.map((m) => (m.id === botId ? { ...m, text: `${label ? `${label}\n` : ''}${streamed}` } : m)),
            updatedAt: Date.now(),
          }))
        }
      }

      const duration = Date.now() - start
      setTelemetry((prev) => ({ ...prev, successResponses: prev.successResponses + 1, totalResponseMs: prev.totalResponseMs + duration }))
      if (streamed.trim()) saveConversationMemory(conversationId, `Phản hồi trước đó: ${streamed}`)
    } catch (error) {
      setErrorHint(friendlyError(error))
      setTelemetry((prev) => ({ ...prev, errorResponses: prev.errorResponses + 1 }))
      updateConversation(conversationId, (cv) => ({
        ...cv,
        messages: cv.messages.map((m) => (m.id === botId ? { ...m, text: friendlyError(error), isError: true } : m)),
      }))
    } finally {
      requestControllerRef.current = null
    }
  }

  const callOllamaNonStream = async (model: string, prompt: string) => {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature: settings.temperature },
        messages: buildPromptContext(activeConversation ?? getNewConversation()).concat([{ role: 'user', content: prompt }]),
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return String(data?.message?.content ?? '')
  }

  const buildLayeredPrompt = (input: string) => {
    if (explainLevel === 'simple') return `Giải thích SIÊU DỄ HIỂU cho học sinh mới học, dùng ví dụ đời thường:\n\n${input}`
    if (explainLevel === 'textbook') return `Giải thích CHUẨN SÁCH GIÁO KHOA, mạch lạc, đủ định nghĩa và công thức:\n\n${input}`
    return `Giải thích NÂNG CAO kiểu thi học sinh giỏi, có tư duy tổng quát và lưu ý bẫy sai:\n\n${input}`
  }

  const guardLearningDependency = (input: string) => {
    if (!antiDependencyEnabled || !DANGEROUS_SOLVE_ALL_PATTERN.test(input)) return { guardedInput: input, warned: false }
    const guardedInput = `Học sinh đang có xu hướng "làm hộ toàn bộ". KHÔNG đưa đáp án đầy đủ ngay.
Hãy trả lời theo từng bước gợi ý:
1) nhắc kiến thức nền cần dùng,
2) yêu cầu học sinh tự làm bước kế tiếp bằng câu hỏi dẫn dắt,
3) chỉ đưa đáp án sau khi đã qua các bước trung gian.

Yêu cầu học sinh:
${input}`
    return { guardedInput, warned: true }
  }

  const generateQuiz = async (topic: string, withTimerMinutes?: 15 | 45) => {
    const prompt = `Tạo một đề kiểm tra dạng JSON thuần (không markdown, không code fence) theo schema:
{
  "title": "string",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|true_false",
      "question": "string",
      "options": ["A", "B", "C", "D"] hoặc ["Đúng", "Sai"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "de|trung_binh|kho",
      "points": number
    }
  ]
}

Yêu cầu:
- Chủ đề: ${topic}
- Số câu: ${assessmentQuestionCount}
- Độ khó: ${assessmentDifficulty}
- Trộn cả câu trắc nghiệm và đúng/sai.
- Câu hỏi rõ ràng, phù hợp học sinh.
${withTimerMinutes ? `- Mô phỏng đề thời gian ${withTimerMinutes} phút.` : ''}`
    const raw = await callOllamaNonStream(settings.model, prompt)
    const parsed = toJsonFromModel<QuizPayload>(raw)
    return {
      ...parsed,
      questions: (parsed.questions ?? []).map((q, index) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        points: Number.isFinite(q.points) && q.points > 0 ? q.points : getDefaultPointsByDifficulty(q.difficulty),
      })),
    }
  }

  async function submitAssessment() {
    setAssessmentSession((prev) => {
      if (!prev || prev.submitted) return prev
      const totalPoints = prev.questions.reduce((sum, q) => sum + q.points, 0)
      const earnedPoints = prev.questions.reduce((sum, q) => (prev.answers[q.id] === q.correctAnswer ? sum + q.points : sum), 0)
      const correctCount = prev.questions.filter((q) => prev.answers[q.id] === q.correctAnswer).length
      const wrongQuestionTitles = prev.questions.filter((q) => prev.answers[q.id] !== q.correctAnswer).map((q) => q.question)
      const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0
      return { ...prev, submitted: true, score, totalPoints, correctCount, wrongQuestionTitles }
    })
    setTimeLeftMs(null)
  }

  const analyzeCommonMistakes = async () => {
    if (!assessmentSession?.submitted) return
    const wrong = assessmentSession.questions.filter((q) => assessmentSession.answers[q.id] !== q.correctAnswer)
    if (!wrong.length) {
      setAssessmentSession((prev) => (prev ? { ...prev, analysis: 'Bạn làm rất tốt. Không có lỗi sai nào trong bài này.' } : prev))
      return
    }
    try {
      const prompt = `Phân tích sai lầm phổ biến của học sinh từ các câu sai sau và đưa kế hoạch ôn tập ngắn gọn:\n${wrong
        .map((q) => `- ${q.question}\n  Đúng: ${q.correctAnswer}\n  Học sinh chọn: ${assessmentSession.answers[q.id] ?? '(chưa chọn)'}`)
        .join('\n')}`
      const analysis = await callOllamaNonStream(settings.model, prompt)
      setAssessmentSession((prev) => (prev ? { ...prev, analysis } : prev))
    } catch {
      setAssessmentSession((prev) => (prev ? { ...prev, analysis: 'Chưa phân tích được lỗi sai. Vui lòng thử lại.' } : prev))
    }
  }

  const buildMindmapFromLatestBotMessage = async () => {
    if (!activeConversation) return
    const latestBot = [...activeConversation.messages].reverse().find((m) => m.sender === 'bot' && !m.isError && m.text.trim())
    if (!latestBot) {
      setErrorHint('Chưa có phản hồi AI để tạo sơ đồ tư duy.')
      return
    }
    setMindmapLoading(true)
    setErrorHint('')
    try {
      const prompt = `Chuyển nội dung sau thành sơ đồ tư duy JSON thuần (không markdown, không code fence) theo schema:
{
  "title": "chủ đề chính",
  "children": [
    {
      "title": "nhánh 1",
      "children": [{ "title": "ý nhỏ 1" }, { "title": "ý nhỏ 2" }]
    }
  ]
}
Yêu cầu: ngắn gọn, dễ học, tối đa 3 tầng.

Nội dung:
${latestBot.text.slice(0, 10000)}`
      const raw = await callOllamaNonStream(settings.model, prompt)
      const parsed = toJsonFromModel<MindmapNode>(raw)
      setMindmapData(parsed)
    } catch (error) {
      setErrorHint(friendlyError(error))
    } finally {
      setMindmapLoading(false)
    }
  }

  const startTimedExam = async (minutes: 15 | 45) => {
    const topic = message.trim() || 'Kiến thức tổng hợp theo nội dung gần nhất'
    setIsLoading(true)
    setErrorHint('')
    try {
      const quiz = await generateQuiz(topic, minutes)
      setAssessmentSession({
        title: quiz.title || `Đề mô phỏng ${minutes} phút`,
        questions: quiz.questions,
        answers: {},
        startedAt: Date.now(),
        durationMs: minutes * 60 * 1000,
        submitted: false,
        score: 0,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        correctCount: 0,
        wrongQuestionTitles: [],
        analysis: '',
      })
    } catch (error) {
      setErrorHint(friendlyError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const sendPrompt = async (text?: string) => {
    if (!activeConversation || isLoading) return
    const input = (text ?? message).trim()
    if (!input) return
    const layeredInput = buildLayeredPrompt(input)
    const { guardedInput, warned } = guardLearningDependency(layeredInput)
    if (warned) setErrorHint('Phát hiện yêu cầu "làm hộ toàn bộ". Đã chuyển sang chế độ gợi ý từng bước để bảo toàn năng lực tự học.')

    setIsLoading(true)
    setErrorHint('')
    setShowOnboarding(false)
    setLastPrompt(input)
    setTelemetry((prev) => ({ ...prev, totalPrompts: prev.totalPrompts + 1 }))

    const userMessage: Message = { id: uid(), text: input, sender: 'user', timestamp: Date.now() }
    const nextMessages = [...activeConversation.messages, userMessage]
    const currentMemoryNotes = activeConversation.memoryNotes
    saveConversationMemory(activeConversation.id, `Người dùng vừa hỏi: ${input}`)
    updateConversation(activeConversation.id, (cv) => ({
      ...cv,
      title: cv.title === 'Cuộc trò chuyện mới' ? input.slice(0, 36) : cv.title,
      messages: nextMessages,
      updatedAt: Date.now(),
    }))
    setMessage('')

    if (assessmentMode) {
      try {
        const quiz = await generateQuiz(guardedInput)
        setAssessmentSession({
          title: quiz.title || 'Bai kiem tra nhanh',
          questions: quiz.questions,
          answers: {},
          startedAt: Date.now(),
          submitted: false,
          score: 0,
          totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
          correctCount: 0,
          wrongQuestionTitles: [],
          analysis: '',
        })
        updateConversation(activeConversation.id, (cv) => ({
          ...cv,
          messages: [...cv.messages, { id: uid(), text: 'Da tao bo cau hoi trac nghiem/dung-sai. Hay lam bai ben duoi va bam nop bai de cham diem.', sender: 'bot', timestamp: Date.now(), model: settings.model }],
          updatedAt: Date.now(),
        }))
      } catch (error) {
        setErrorHint(friendlyError(error))
      }
    } else if (settings.compareMode && settings.secondaryModel && settings.secondaryModel !== settings.model) {
      await Promise.all([
        streamReply(activeConversation.id, settings.model, [...nextMessages.slice(0, -1), { ...userMessage, text: guardedInput }], currentMemoryNotes, `A - ${settings.model}`),
        streamReply(activeConversation.id, settings.secondaryModel, [...nextMessages.slice(0, -1), { ...userMessage, text: guardedInput }], currentMemoryNotes, `B - ${settings.secondaryModel}`),
      ])
    } else {
      await streamReply(activeConversation.id, settings.model, [...nextMessages.slice(0, -1), { ...userMessage, text: guardedInput }], currentMemoryNotes)
    }

    setIsLoading(false)
  }

  const stopGenerating = () => {
    requestControllerRef.current?.abort()
    setIsLoading(false)
    setTelemetry((prev) => ({ ...prev, abortedResponses: prev.abortedResponses + 1 }))
  }

  const createConversation = () => {
    const next = getNewConversation()
    setConversations((prev) => [next, ...prev])
    setActiveConversationId(next.id)
    setSidebarOpen(false)
    setShowOnboarding(true)
  }

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) {
      updateConversation(id, () => getNewConversation())
      return
    }
    const next = conversations.filter((item) => item.id !== id)
    setConversations(next)
    if (activeConversationId === id) setActiveConversationId(next[0].id)
  }

  const saveTemplate = () => {
    const name = newTemplateName.trim()
    const content = message.trim()
    if (!name || !content) return
    setTemplates((prev) => [{ id: uid(), name, content }, ...prev])
    setNewTemplateName('')
  }

  const addMemoryFromMessage = (text: string) => {
    if (!activeConversation) return
    const clipped = text.replace(/\s+/g, ' ').trim().slice(0, 160)
    if (!clipped) return
    updateConversation(activeConversation.id, (cv) => ({
      ...cv,
      memoryNotes: [...new Set([clipped, ...cv.memoryNotes])].slice(0, 10),
      updatedAt: Date.now(),
    }))
  }

  const voteResponse = (helpful: boolean) => {
    setTelemetry((prev) => ({
      ...prev,
      helpfulVotes: prev.helpfulVotes + (helpful ? 1 : 0),
      unhelpfulVotes: prev.unhelpfulVotes + (helpful ? 0 : 1),
    }))
  }

  const ui = {
    pageBg: '#F3F8F3',
    panelBg: '#EFF8EF',
    panelBorder: '#B7D2B7',
    headerBg: '#DDEEDD',
    sidebarBg: '#EAF5EA',
    sectionBg: '#D8EAD8',
    inputBg: '#E1EFE1',
    textMain: '#132018',
    textSub: '#4D5B52',
    userBubble: '#BFE0BF',
    botBubble: '#EAF5EA',
    botBorder: '#B7D2B7',
    chipBg: '#D7EAD7',
    fieldBg: '#EFF8EF',
    hoverBg: '#C5DFC5',
    accent: '#2E7D32',
  }

  const renderMindmapNode = (node: MindmapNode, depth = 0, path = '0'): JSX.Element => (
    <Box key={`${path}_${node.title}`} sx={{ position: 'relative', pl: depth ? 2 : 0, mt: depth ? 1 : 0 }}>
      {depth > 0 && (
        <>
          <Box sx={{ position: 'absolute', left: 6, top: 0, bottom: 18, width: 2, bgcolor: '#86b686', borderRadius: 1 }} />
          <Box sx={{ position: 'absolute', left: 6, top: 18, width: 14, height: 2, bgcolor: '#86b686', borderRadius: 1 }} />
        </>
      )}
      <Paper
        elevation={0}
        sx={{
          display: 'inline-block',
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: depth === 0 ? '#2E7D32' : '#9fc79f',
          bgcolor: depth === 0 ? '#d7ecd7' : '#edf7ed',
          maxWidth: '100%',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: depth === 0 ? 700 : 600, color: ui.textMain }}>
          {node.title}
        </Typography>
      </Paper>
      {(node.children ?? []).slice(0, 8).map((child, index) => renderMindmapNode(child, depth + 1, `${path}.${index}`))}
    </Box>
  )

  const sidebarContent = (
    <Box
      sx={{
        width: '100%',
        p: 1.5,
        bgcolor: ui.sidebarBg,
        color: ui.textMain,
        height: '100%',
        borderRight: { md: '1px solid' },
        borderColor: { md: ui.panelBorder },
        '& .MuiListItemButton-root': {
          borderRadius: 1,
          transition: 'background-color 160ms ease',
          '&:hover': { bgcolor: ui.hoverBg },
        },
        '& .MuiListItemButton-root.Mui-selected': { bgcolor: 'rgba(52,168,83,0.18)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>Hội thoại</Typography>
        {isMobile && <IconButton size="small" onClick={() => setSidebarOpen(false)}><CloseIcon /></IconButton>}
      </Stack>
      <Button startIcon={<AddIcon />} fullWidth variant="contained" sx={{ mt: 1, bgcolor: ui.accent, '&:hover': { bgcolor: '#256A29' } }} onClick={createConversation}>Tạo hội thoại</Button>
      <Divider sx={{ my: 1.5 }} />
      <List dense sx={{ maxHeight: '46dvh', overflowY: 'auto' }}>
        {conversations.map((item) => (
          <ListItemButton key={item.id} selected={item.id === activeConversationId} onClick={() => { setActiveConversationId(item.id); if (isMobile) setSidebarOpen(false) }}>
            <ListItemText primary={item.title} secondary={new Date(item.updatedAt).toLocaleString('vi-VN')} />
            <Badge color="primary" badgeContent={item.messages.length} sx={{ mr: 1 }} />
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteConversation(item.id) }}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </ListItemButton>
        ))}
      </List>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <TextField size="small" fullWidth placeholder="Đổi tên hội thoại hiện tại" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} />
        <Button onClick={() => {
          if (!activeConversation || !renameInput.trim()) return
          updateConversation(activeConversation.id, (cv) => ({ ...cv, title: renameInput.trim(), updatedAt: Date.now() }))
          setRenameInput('')
        }}>Lưu</Button>
      </Stack>

      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Bộ nhớ dài hạn hội thoại này</Typography>
        <Button
          size="small"
          onClick={() => {
            if (!activeConversation) return
            updateConversation(activeConversation.id, (cv) => ({ ...cv, memoryNotes: [], updatedAt: Date.now() }))
          }}
        >
          Xóa
        </Button>
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
        {(activeConversation?.memoryNotes ?? []).slice(0, 6).map((item) => <Chip key={item} label={item.slice(0, 28)} size="small" />)}
      </Stack>
    </Box>
  )

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', px: { xs: 0.5, sm: 1, md: 1.25 }, py: { xs: 0.5, sm: 0.75 }, bgcolor: ui.pageBg, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          filter: 'blur(52px)',
          opacity: 0.26,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, #34A853 0%, #9B72CB 52%, #D96570 100%)',
        }}
      />
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 'none',
          height: { xs: 'calc(100dvh - 8px)', sm: 'calc(100dvh - 12px)' },
          border: '1px solid',
          borderColor: ui.panelBorder,
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          bgcolor: ui.panelBg,
          color: ui.textMain,
          boxShadow: '0 12px 24px rgba(30, 41, 59, 0.10)',
          transition: 'box-shadow 180ms ease',
          '& .MuiChip-root': {
            bgcolor: ui.chipBg,
            color: ui.textMain,
            borderColor: ui.panelBorder,
          },
          '& .MuiButton-outlined': {
            borderColor: ui.panelBorder,
            color: ui.textMain,
          },
          '& .MuiInputBase-root': {
            bgcolor: ui.fieldBg,
            color: ui.textMain,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: ui.panelBorder,
          },
          '& .MuiInputLabel-root': {
            color: ui.textSub,
          },
          '& .MuiSelect-icon': {
            color: ui.textSub,
          },
        }}
      >
        {!isMobile && (
          <Box sx={{ width: { md: 270, lg: 300 }, minWidth: { md: 270, lg: 300 } }}>
            {sidebarContent}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: { xs: 1.25, sm: 1.5 }, borderBottom: '1px solid', borderColor: ui.panelBorder, bgcolor: ui.headerBg }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {isMobile && <IconButton size="small" onClick={() => setSidebarOpen(true)}><MenuIcon /></IconButton>}
              <AutoAwesomeIcon
                fontSize="small"
                sx={{
                  background: 'linear-gradient(135deg, #34A853 0%, #9B72CB 52%, #D96570 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              />
              <Typography fontWeight={700} sx={{ color: ui.textMain }}>Bé Sen AI</Typography>
              <Chip size="small" label={activeConversation?.title ?? 'Hội thoại'} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Cài đặt"><IconButton size="small" onClick={() => setSettingsOpen(true)}><SettingsIcon /></IconButton></Tooltip>
              <Tooltip title="Xóa chat"><IconButton size="small" onClick={() => activeConversation && updateConversation(activeConversation.id, (cv) => ({ ...cv, messages: [getInitialBotMessage()], title: 'Cuộc trò chuyện mới', memoryNotes: [] }))}><DeleteOutlineIcon /></IconButton></Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Collapse in={Boolean(errorHint)}>
          <Alert severity="warning" action={<Button size="small" onClick={() => void sendPrompt(lastPrompt)} disabled={!lastPrompt || isLoading}>Thử lại</Button>} sx={{ borderRadius: 0 }}>{errorHint}</Alert>
        </Collapse>

        {showOnboarding && activeConversation?.messages.length === 1 && (
          <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 1.5 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, color: ui.textSub }}>Bắt đầu nhanh</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {ONBOARDING_PROMPTS.map((p) => <Chip key={p} label={p} onClick={() => void sendPrompt(p)} />)}
            </Stack>
          </Box>
        )}

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip icon={<BoltOutlinedIcon />} label="Tác vụ nhanh" variant="outlined" sx={{ borderColor: ui.panelBorder }} />
            {QUICK_ACTIONS.map((action) => (
              <Chip key={action.label} label={action.label} onClick={() => setMessage((prev) => `${action.prefix}${prev}`)} />
            ))}
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 1.25 }}>
          <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: ui.panelBorder, bgcolor: '#fff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <QuizOutlinedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={600}>MVP Giáo dục</Typography>
              </Stack>
              <Button size="small" onClick={() => setLearningModeOpen((prev) => !prev)}>{learningModeOpen ? 'Thu gọn' : 'Mở'}</Button>
            </Stack>
            <Collapse in={learningModeOpen}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip color={assessmentMode ? 'primary' : 'default'} label={assessmentMode ? 'Đang bật: trả về trắc nghiệm' : 'Bật trả về trắc nghiệm'} onClick={() => setAssessmentMode((prev) => !prev)} />
                <Chip color={antiDependencyEnabled ? 'warning' : 'default'} label={antiDependencyEnabled ? 'An toàn học đường: bật' : 'An toàn học đường: tắt'} onClick={() => setAntiDependencyEnabled((prev) => !prev)} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Giải thích 3 tầng</InputLabel>
                  <Select value={explainLevel} label="Giải thích 3 tầng" onChange={(e) => setExplainLevel(e.target.value as 'simple' | 'textbook' | 'advanced')}>
                    <MenuItem value="simple">1) Siêu dễ hiểu</MenuItem>
                    <MenuItem value="textbook">2) Chuẩn sách giáo khoa</MenuItem>
                    <MenuItem value="advanced">3) Nâng cao HSG</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Độ khó</InputLabel>
                  <Select value={assessmentDifficulty} label="Độ khó" onChange={(e) => setAssessmentDifficulty(e.target.value as 'de' | 'trung_binh' | 'kho')}>
                    <MenuItem value="de">Dễ</MenuItem>
                    <MenuItem value="trung_binh">Trung bình</MenuItem>
                    <MenuItem value="kho">Khó</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  type="number"
                  label="Số câu"
                  value={assessmentQuestionCount}
                  onChange={(e) => setAssessmentQuestionCount(Math.max(3, Math.min(30, Number(e.target.value) || 6)))}
                  sx={{ width: 120 }}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" startIcon={<TimerOutlinedIcon />} variant="outlined" onClick={() => void startTimedExam(15)} disabled={isLoading}>Đề 15 phút</Button>
                <Button size="small" startIcon={<TimerOutlinedIcon />} variant="outlined" onClick={() => void startTimedExam(45)} disabled={isLoading}>Đề 45 phút</Button>
              </Stack>
              {isMobile && (
                <Paper elevation={0} sx={{ mt: 1, p: 1, borderRadius: 2, border: '1px solid', borderColor: ui.panelBorder, bgcolor: '#F6FBF6' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>Sơ đồ tư duy</Typography>
                  <Button
                    size="small"
                    fullWidth
                    variant="contained"
                    onClick={() => void buildMindmapFromLatestBotMessage()}
                    disabled={mindmapLoading}
                    sx={{ bgcolor: ui.accent, '&:hover': { bgcolor: '#256A29' } }}
                  >
                    {mindmapLoading ? 'Đang tạo sơ đồ...' : 'Tạo từ phản hồi AI gần nhất'}
                  </Button>
                  {mindmapData && <Box sx={{ mt: 0.75 }}>{renderMindmapNode(mindmapData)}</Box>}
                </Paper>
              )}
            </Collapse>
          </Paper>
        </Box>

        <Box className="chat-messages" sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 3 }, scrollBehavior: 'smooth', bgcolor: ui.sectionBg }}>
          {assessmentSession && (
            <Paper elevation={0} sx={{ mb: 2, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: '#cbd5e1' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>{assessmentSession.title}</Typography>
              {timeLeftMs !== null && (
                <Alert severity={timeLeftMs < 60_000 ? 'warning' : 'info'} sx={{ mb: 1 }}>
                  Thời gian còn lại: {Math.floor(timeLeftMs / 60000)}:{String(Math.floor((timeLeftMs % 60000) / 1000)).padStart(2, '0')}
                </Alert>
              )}
              <Stack spacing={1.5}>
                {assessmentSession.questions.map((q, index) => (
                  <Box key={q.id}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{index + 1}. {q.question}</Typography>
                    <Typography variant="caption" sx={{ color: ui.textSub, display: 'block', mt: 0.25 }}>
                      Điểm câu này: {q.points}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 0.75, gap: 0.75 }}>
                      {q.options.map((opt) => {
                        const selected = assessmentSession.answers[q.id] === opt
                        const showResult = assessmentSession.submitted
                        const isCorrect = opt === q.correctAnswer
                        const chipSx = !showResult && selected
                          ? {
                              bgcolor: ui.accent,
                              color: '#fff',
                              border: '2px solid',
                              borderColor: '#1B5E20',
                              fontWeight: 700,
                              boxShadow: '0 0 0 2px rgba(46,125,50,0.2)',
                            }
                          : undefined
                        return (
                          <Chip
                            key={opt}
                            clickable={!assessmentSession.submitted}
                            color={showResult ? (isCorrect ? 'success' : (selected ? 'error' : 'default')) : (selected ? 'primary' : 'default')}
                            label={opt}
                            sx={chipSx}
                            onClick={() => {
                              if (assessmentSession.submitted) return
                              setAssessmentSession((prev) => {
                                if (!prev) return prev
                                return { ...prev, answers: { ...prev.answers, [q.id]: opt } }
                              })
                            }}
                          />
                        )
                      })}
                    </Stack>
                    {assessmentSession.submitted && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Gợi ý: {q.explanation}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={() => void submitAssessment()}
                  disabled={assessmentSession.submitted}
                  sx={{ bgcolor: ui.accent, '&:hover': { bgcolor: '#256A29' } }}
                >
                  Nộp bài
                </Button>
                <Button variant="outlined" onClick={() => void analyzeCommonMistakes()} disabled={!assessmentSession.submitted}>Phân tích sai lầm phổ biến</Button>
              </Stack>
              {assessmentSession.submitted && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Điểm: {assessmentSession.score}/100 | Đúng: {assessmentSession.correctCount}/{assessmentSession.questions.length} câu | Tổng điểm: {assessmentSession.questions.reduce((sum, q) => sum + (assessmentSession.answers[q.id] === q.correctAnswer ? q.points : 0), 0)}/{assessmentSession.totalPoints}
                </Alert>
              )}
              {assessmentSession.submitted && assessmentSession.wrongQuestionTitles.length > 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Sai {assessmentSession.wrongQuestionTitles.length} câu: {assessmentSession.wrongQuestionTitles.join(' | ')}
                </Alert>
              )}
              {assessmentSession.analysis && <MessageContent content={assessmentSession.analysis} sender="bot" />}
            </Paper>
          )}
          {(activeConversation?.messages ?? []).map((msg) => (
            <Box key={msg.id} sx={{ mb: 2, display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.2, sm: 1.6 },
                  maxWidth: { xs: '96%', sm: '82%', md: '74%' },
                  bgcolor: msg.sender === 'user' ? ui.userBubble : ui.botBubble,
                  color: ui.textMain,
                  borderRadius: 3,
                  border: 'none',
                  borderColor: msg.isError ? '#f59e0b' : ui.botBorder,
                }}
              >
                {msg.model && <Typography variant="caption" sx={{ opacity: 0.7 }}>{msg.model}</Typography>}
                <MessageContent content={msg.text} sender={msg.sender} />
                <Typography variant="caption" sx={{ opacity: 0.65, mt: 0.75, display: 'block' }}>{new Date(msg.timestamp).toLocaleTimeString('vi-VN')}</Typography>
                {msg.sender === 'bot' && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Tooltip title="Sao chép"><IconButton size="small" onClick={() => navigator.clipboard.writeText(msg.text)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Ghim vào bộ nhớ"><IconButton size="small" onClick={() => addMemoryFromMessage(msg.text)}><PushPinOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Hữu ích"><IconButton size="small" onClick={() => voteResponse(true)}><ThumbUpAltOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Chưa đúng"><IconButton size="small" onClick={() => voteResponse(false)}><ThumbDownAltOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                )}
                {msg.sender === 'bot' && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: ui.textSub }}>
                    Khuyến nghị: Không nên chat quá nhiều chủ đề trong một hội thoại. Nếu đổi chủ đề, hãy tạo hội thoại mới để AI nhớ chính xác hơn.
                  </Typography>
                )}
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: { xs: 1.25, sm: 2 }, borderTop: '1px solid', borderColor: ui.panelBorder, pb: { xs: 'calc(10px + env(safe-area-inset-bottom))', sm: 2 }, bgcolor: ui.inputBg }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Chip icon={<LibraryBooksOutlinedIcon />} label="Prompt Studio" variant="outlined" />
            {templates.slice(0, 4).map((item) => <Chip key={item.id} label={item.name} onClick={() => setMessage(item.content)} />)}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Tên mẫu prompt" sx={{ width: { xs: '100%', sm: 220 } }} />
            <Button variant="outlined" onClick={saveTemplate} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>Lưu mẫu từ nội dung nhập</Button>
          </Stack>

          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <TextField
              multiline
              minRows={2}
              maxRows={8}
              fullWidth
              autoFocus
              placeholder="Nhập tin nhắn của bạn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void sendPrompt())}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: '24px', sm: '30px' },
                  bgcolor: '#F7FCF7',
                },
              }}
            />
            {isLoading ? (
              <IconButton onClick={stopGenerating} sx={{ bgcolor: '#FBBC04', color: '#1f2937' }}><StopCircleIcon /></IconButton>
            ) : (
              <IconButton onClick={() => void sendPrompt()} disabled={!message.trim()} sx={{ bgcolor: ui.accent, color: '#ffffff', '&:hover': { bgcolor: '#256A29' } }}><SendIcon /></IconButton>
            )}
            <Tooltip title="Gửi lại prompt gần nhất"><span><IconButton onClick={() => void sendPrompt(lastPrompt)} disabled={!lastPrompt || isLoading}><ReplayIcon /></IconButton></span></Tooltip>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.65, mt: 0.5, display: 'block' }}>Enter để gửi, Shift + Enter để xuống dòng.</Typography>
        </Box>
        </Box>

        {!isMobile && isWideDesktop && (
          <Box sx={{ width: 320, minWidth: 320, borderLeft: '1px solid', borderColor: ui.panelBorder, bgcolor: '#ECF6EC', p: 1.5, overflowY: 'auto' }}>
            <Typography variant="subtitle1" fontWeight={700}>Sơ đồ tư duy</Typography>
            <Typography variant="caption" sx={{ color: ui.textSub, display: 'block', mb: 1 }}>
              Tạo từ phản hồi AI gần nhất trong cuộc trò chuyện hiện tại.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => void buildMindmapFromLatestBotMessage()}
              disabled={mindmapLoading}
              sx={{ bgcolor: ui.accent, '&:hover': { bgcolor: '#256A29' } }}
            >
              {mindmapLoading ? 'Đang tạo sơ đồ...' : 'Tạo sơ đồ từ phản hồi AI'}
            </Button>
            <Paper elevation={0} sx={{ mt: 1.25, p: 1.25, border: '1px solid', borderColor: ui.panelBorder, bgcolor: '#F6FBF6', borderRadius: 2 }}>
              {mindmapData ? (
                renderMindmapNode(mindmapData)
              ) : (
                <Typography variant="body2" sx={{ color: ui.textSub }}>
                  Chưa có sơ đồ. Sau khi AI trả lời, bấm nút để tạo sơ đồ tư duy theo nội dung đáp án (ví dụ lời giải bài toán).
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Paper>

      {isMobile && (
        <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          {sidebarContent}
        </Drawer>
      )}

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cài đặt chatbot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Model chính</InputLabel>
              <Select value={settings.model} label="Model chính" onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}>
                {availableModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Model phụ (A/B)</InputLabel>
              <Select value={settings.secondaryModel} label="Model phụ (A/B)" onChange={(e) => setSettings((prev) => ({ ...prev, secondaryModel: e.target.value }))}>
                {availableModels.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <Chip
              color={settings.compareMode ? 'primary' : 'default'}
              label={settings.compareMode ? 'Đang bật so sánh 2 model' : 'Đang tắt so sánh 2 model'}
              onClick={() => setSettings((prev) => ({ ...prev, compareMode: !prev.compareMode }))}
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Temperature: {settings.temperature.toFixed(1)}</Typography>
              <Slider value={settings.temperature} min={0} max={1} step={0.1} onChange={(_, v) => setSettings((prev) => ({ ...prev, temperature: Number(v) }))} />
            </Box>
            <TextField
              label="Hướng dẫn hệ thống"
              multiline
              minRows={3}
              value={settings.systemPrompt}
              onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ChatbotComponent
