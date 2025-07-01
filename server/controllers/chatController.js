import Chat from '../models/Chat.js'

const SYSTEM_PROMPT = `You are BinGo Assistant, a helpful AI assistant specialized in waste management and environmental topics. You can:

1. Answer questions about waste management, recycling, and environmental practices
2. Help identify if items are biodegradable or not
3. Provide tips on sustainable living and waste reduction
4. Give advice on proper disposal methods for different types of waste
5. Suggest eco-friendly alternatives to common products
6. Explain composting and recycling processes
7. Provide information about environmental impact of different materials

Be friendly, informative, and environmentally conscious in your responses. Keep your answers concise but helpful. Always encourage sustainable practices and environmental responsibility.`

export const handleChat = (genAI) => async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    let chat = await Chat.findOne({ sessionId })
    if (!chat) {
      chat = new Chat({
        sessionId,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }]
      })
    }

    chat.messages.push({ role: 'user', content: message })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const recentMessages = chat.messages.slice(-10)
    let conversationHistory = SYSTEM_PROMPT + "\n\nConversation history:\n"
    recentMessages.forEach(msg => {
      if (msg.role !== 'system') {
        conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`
      }
    })
    conversationHistory += `\nPlease respond to the user's latest message: "${message}"`

    const result = await model.generateContent(conversationHistory)
    const assistantReply = result.response.text()

    chat.messages.push({ role: 'model', content: assistantReply })
    await chat.save()

    res.json({ reply: assistantReply })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: 'Sorry, I encountered an error. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params
    const chat = await Chat.findOne({ sessionId })
    if (!chat) {
      return res.json({ messages: [] })
    }
    const userMessages = chat.messages.filter(msg => msg.role !== 'system')
    res.json({ messages: userMessages })
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({ error: 'Failed to retrieve chat history' })
  }
}

export const clearChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params
    await Chat.deleteOne({ sessionId })
    res.json({ message: 'Chat history cleared successfully' })
  } catch (error) {
    console.error('Clear chat history error:', error)
    res.status(500).json({ error: 'Failed to clear chat history' })
  }
}