import Chat from '../models/Chat.js'

const SYSTEM_PROMPT = `You are BinGo Assistant, a helpful AI assistant specialized in waste management and environmental topics. ...` // (same as above)

export const handleImageAnalysis = (genAI) => async (req, res) => {
  try {
    const { imageBase64, sessionId = 'default' } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze this waste item image and provide a detailed response covering:

1. **Item Identification**: What specific type of waste/item this is
2. **Biodegradability**: Is it biodegradable or non-biodegradable? Explain why.
3. **Disposal Method**: How should this item be properly disposed of?
4. **Recycling Options**: Can it be recycled? If yes, how and where?
5. **Environmental Impact**: Brief note on its environmental impact
6. **Eco-friendly Alternatives**: Suggest sustainable alternatives if applicable

Please be concise but informative, and focus on practical waste management advice.`

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    }

    const result = await model.generateContent([prompt, imagePart])
    const analysis = result.response.text()

    let chat = await Chat.findOne({ sessionId })
    if (!chat) {
      chat = new Chat({
        sessionId,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }]
      })
    }

    chat.messages.push(
      { role: 'user', content: '[Image uploaded for waste analysis]' },
      { role: 'model', content: analysis }
    )
    await chat.save()

    res.json({ analysis })
  } catch (error) {
    console.error('Image analysis error:', error)
    res.status(500).json({
      error: 'Sorry, I couldn\'t analyze the image. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}