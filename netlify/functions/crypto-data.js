exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const { coin } = JSON.parse(event.body || '{}');
        
        // Connect to Claude API with your MCP
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: `Get current ${coin} social sentiment, price, and social volume from LunarCrush. Return as JSON with price, sentiment, socialVolume, change24h, and news array.`
                }]
            })
        });
        
        const claudeData = await claudeResponse.json();
        
        // For now, let's use mock data until Claude connection is perfect
        const mockData = {
            price: (Math.random() * 100).toFixed(4),
            sentiment: (Math.random() * 100).toFixed(1),
            socialVolume: Math.floor(Math.random() * 10000),
            change24h: ((Math.random() - 0.5) * 20).toFixed(2),
            news: [{
                title: `${coin} shows strong social momentum`,
                source: 'CryptoSlate',
                time: '2 hours ago',
                url: 'https://cryptoslate.com'
            }]
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockData)
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
