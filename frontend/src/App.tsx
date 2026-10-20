import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import theme from './theme'
import ChatbotComponent from './components/Chatbot'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          color: 'text.primary',
          display: 'flex',
        }}
      >
        <ChatbotComponent />
      </Box>
    </ThemeProvider>
  )
}

export default App

