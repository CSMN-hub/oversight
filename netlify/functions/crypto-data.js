const fetch = require('node-fetch');

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
        const { coin } = JSON.parse(event.body || '{}');
        
        if (!coin) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Coin parameter is required' })
            };
        }

        console.log(`Fetching data for ${coin}...`);

        // Try Claude AI Analysis with LunarCrush context
        const prompt = `Analyze the memecoin ${coin} and provide current market intelligence.

Please provide a JSON response with realistic current data for ${coin}:

1. Current price estimate based on recent market trends
2. Social sentiment score (0-100) based on community activity  
3. Social volume estimate
4. 24h price change estimate
5. Generate 2 realistic social media posts/news items

Context: ${coin} is a memecoin with active community. Provide realistic estimates based on current market conditions.

Return ONLY valid JSON in this exact format:
{
    "coin": "${coin}",
    "price": "0.0000",
    "sentiment": "75.5", 
    "socialVolume": 15000,
    "change24h": "-2.34",
    "dataSource": "Claude AI",
    "topPosts": [
        {
            "title": "Realistic post title about ${coin}",
            "source": "Twitter/X",
            "time": "3 hours ago",
            "url": "#",
            "engagement": 850,
            "sentiment": "bullish"
        },
        {
            "title": "Another realistic post title",
            "source": "Reddit", 
            "time": "6 hours ago",
            "url": "#",
            "engagement": 420,
            "sentiment": "neutral"
        }
    ]
}`;

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!claudeResponse.ok) {
            const errorData = await claudeResponse.json();
            throw new Error(`Claude API error: ${errorData.error?.message || claudeResponse.statusText}`);
        }
        
        const claudeData = await claudeResponse.json();
        const content = claudeData.content?.[0]?.text || '';
        
        // Parse JSON from Claude response
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonMatch = [jsonMatch[1]];
            }
        }
        
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            console.log(`✅ Claude provided data for ${coin}`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    ...parsedData,
                    dataSource: 'Claude AI',
                    lastUpdated: new Date().toISOString()
                })
            };
        }
        
        throw new Error('No valid JSON found in Claude response');
        
    } catch (error) {
        console.error('Function error:', error);
        
        // Fallback to realistic mock data
        const { coin } = JSON.parse(event.body || '{}');
        const mockData = generateRealisticMockData(coin || 'BTC');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...mockData,
                isDemo: true,
                dataSource: 'Demo Data',
                error: 'Using demo data - API temporarily unavailable'
            })
        };
    }
};

function generateRealisticMockData(coin) {
    const coinData = {
        'SPX6900': { price: 1.61, sentiment: 78, volume: 25000, change: 8.97 },
        'DOGE': { price: 0.199, sentiment: 65, volume: 45000, change: 0.60 },
        'MOG': { price: 0.00000118, sentiment: 82, volume: 18000, change: 6.28 },
        'GIGA': { price: 0.01592, sentiment: 75, volume: 12000, change: 8.82 },
        'PENGU': { price: 0.03404, sentiment: 70, volume: 22000, change: 4.2 },
        'PUMP': { price: 0.0025, sentiment: 68, volume: 15000, change: -2.1 }
    };
    
    const data = coinData[coin] || { price: 1, sentiment: 60, volume: 10000, change: 0 };
    
    return {
        coin: coin,
        price: (data.price * (0.95 + Math.random() * 0.1)).toFixed(coin === 'MOG' ? 8 : 4),
        sentiment: (data.sentiment + (Math.random() - 0.5) * 10).toFixed(1),
        socialVolume: Math.floor(data.volume * (0.8 + Math.random() * 0.4)),
        change24h: (data.change + (Math.random() - 0.5) * 5).toFixed(2),
        topPosts: [
            {
                title: `${coin} community shows strong engagement in latest social metrics`,
                source: 'Twitter/X',
                time: `${Math.floor(Math.random() * 6) + 1} hours ago`,
                url: '#',
                engagement: Math.floor(Math.random() * 1000 + 200),
                sentiment: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish'
            },
            {
                title: `${coin} trending discussions highlight market momentum`,
                source: 'Reddit',
                time: `${Math.floor(Math.random() * 12) + 1} hours ago`,
                url: '#',
                engagement: Math.floor(Math.random() * 500 + 100),
                sentiment: Math.random() > 0.5 ? 'bullish' : 'neutral'
            }
        ]
    };
}
