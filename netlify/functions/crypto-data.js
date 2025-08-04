exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        // Handle both GET and POST requests
        let coin;
        if (event.httpMethod === 'GET') {
            coin = event.queryStringParameters?.coin;
        } else {
            const body = event.body ? JSON.parse(event.body) : {};
            coin = body.coin;
        }
        
        if (!coin) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Coin parameter is required',
                    message: 'Please provide a coin symbol (e.g., BTC, ETH, DOGE)'
                })
            };
        }

        console.log(`🔍 Fetching data for ${coin}...`);

        // Try Claude AI Analysis if API key is available
        if (process.env.CLAUDE_API_KEY) {
            try {
                console.log(`🤖 Trying Claude AI analysis for ${coin}...`);
                const claudeData = await analyzeWithClaude(coin);
                if (claudeData) {
                    console.log(`✅ Claude provided data for ${coin}`);
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            ...claudeData,
                            dataSource: 'Claude AI Analysis',
                            lastUpdated: new Date().toISOString(),
                            isDemo: false
                        })
                    };
                }
            } catch (claudeError) {
                console.log(`❌ Claude failed for ${coin}:`, claudeError.message);
            }
        } else {
            console.log('⚠️ Claude API key not configured, using demo data');
        }

        // Fallback to Enhanced Mock Data
        console.log(`📊 Using enhanced mock data for ${coin}...`);
        const mockData = generateEnhancedMockData(coin);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...mockData,
                dataSource: 'Demo Data',
                lastUpdated: new Date().toISOString(),
                isDemo: true,
                message: 'Using demo data - Add CLAUDE_API_KEY environment variable for live analysis'
            })
        };
        
    } catch (error) {
        console.error('🚨 Function error:', error);
        
        // Emergency fallback
        let coin = 'BTC';
        try {
            if (event.httpMethod === 'GET') {
                coin = event.queryStringParameters?.coin || 'BTC';
            } else {
                const body = event.body ? JSON.parse(event.body) : {};
                coin = body.coin || 'BTC';
            }
        } catch (e) {
            // Use default if parsing fails
        }
        
        const fallbackData = generateBasicMockData(coin);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...fallbackData,
                dataSource: 'Emergency Fallback',
                lastUpdated: new Date().toISOString(),
                isDemo: true,
                error: `Service temporarily unavailable: ${error.message}`
            })
        };
    }
};

async function analyzeWithClaude(coin) {
    const prompt = `Analyze the cryptocurrency ${coin} and provide current market intelligence.

You are a crypto market analyst. Based on current market conditions and trends, provide realistic estimates for ${coin}.

Context: ${getCoinContext(coin)}

Respond with ONLY a valid JSON object (no markdown, no extra text) in this exact format:

{
    "coin": "${coin.toUpperCase()}",
    "price": "0.0000",
    "sentiment": "75.5",
    "socialVolume": 15000,
    "change24h": "-2.34",
    "marketCap": "500000000",
    "topPosts": [
        {
            "title": "Realistic market update about ${coin}",
            "source": "Twitter/X",
            "time": "3 hours ago",
            "url": "#",
            "engagement": 850,
            "sentiment": "bullish"
        },
        {
            "title": "Community discussion about ${coin}",
            "source": "Reddit",
            "time": "6 hours ago", 
            "url": "#",
            "engagement": 420,
            "sentiment": "neutral"
        }
    ]
}

Provide realistic estimates based on current market conditions.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens
