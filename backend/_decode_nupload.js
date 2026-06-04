// Script para decodificar URLs de nupload.me
const axios = require('axios');

async function decodeNuploadUrl(watchUrl) {
    try {
        const resp = await axios.get(watchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': 'https://pelisflix200.skin/'
            },
            timeout: 10000
        });
        const html = resp.data;
        
        // Find the obfuscated array: var VARNAME = ["b64","b64",...];
        const arrMatch = html.match(/var\s+([a-zA-Z]+)\s*=\s*\[([^\]]+)\];/);
        if (!arrMatch) {
            console.log('No obfuscated array found');
            return null;
        }
        
        const varName = arrMatch[1];
        // Extract all base64 strings from the array
        const itemMatches = arrMatch[2].match(/"([^"]+)"/g);
        if (!itemMatches) {
            console.log('No items in array');
            return null;
        }
        const items = itemMatches.map(s => s.replace(/"/g, ''));
        
        // Find the subtract number in the forEach decoder
        // Pattern: parseInt(atob(value).replace(/\D/g,'')) - SUBTRACT_NUM
        const subMatch = html.match(/parseInt\s*\(\s*atob\s*\(\s*value\s*\)\s*\.\s*replace\s*\(\s*\/\\D\/g\s*,\s*['"]\s*['"]\s*\)\s*\)\s*-\s*(\d+)/);
        if (!subMatch) {
            console.log('Could not find subtract number');
            return null;
        }
        
        const subtractNum = parseInt(subMatch[1]);
        
        // Decode the URL
        let decoded = '';
        items.forEach(item => {
            try {
                const b64decoded = Buffer.from(item, 'base64').toString('utf8');
                const num = parseInt(b64decoded.replace(/\D/g, ''));
                decoded += String.fromCharCode(num - subtractNum);
            } catch (e) {
                // skip invalid items
            }
        });
        
        // Find session
        const sesMatch = html.match(/sesz="([^"]+)"/);
        const session = sesMatch ? sesMatch[1] : '';
        
        const hlsUrl = decoded + (session ? '?s=' + session : '');
        
        return {
            decodedUrl: decoded,
            session: session,
            hlsUrl: hlsUrl,
            varName: varName,
            items: items,
            subtractNum: subtractNum
        };
    } catch (error) {
        console.error('Error decoding nupload URL:', error.message);
        return null;
    }
}

// Test with the URL from the stream endpoint
const testUrl = 'https://nupload.me/watch/OX3jz3ERobdGObWuyq73jz3kZ3FCOwGg5f7kz7ZYJii5KHz49P1o';

decodeNuploadUrl(testUrl).then(result => {
    if (result) {
        console.log('=== DECODED RESULT ===');
        console.log('Var name:', result.varName);
        console.log('Items count:', result.items.length);
        console.log('Subtract number:', result.subtractNum);
        console.log('Decoded URL:', result.decodedUrl);
        console.log('Session:', result.session);
        console.log('Full HLS URL:', result.hlsUrl);
        
        // Now test if we can access the HLS URL
        if (result.hlsUrl) {
            console.log('\n=== Testing HLS URL access ===');
            axios.get(result.hlsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Referer': 'https://nupload.me/',
                    'Origin': 'https://nupload.me'
                },
                timeout: 10000,
                responseType: 'text'
            }).then(hlsResp => {
                console.log('HLS URL status:', hlsResp.status);
                console.log('HLS content type:', hlsResp.headers['content-type']);
                console.log('HLS content (first 500 chars):', hlsResp.data.substring(0, 500));
            }).catch(err => {
                console.log('HLS URL error:', err.message);
                if (err.response) {
                    console.log('Status:', err.response.status);
                    console.log('Headers:', JSON.stringify(err.response.headers));
                }
            });
        }
    } else {
        console.log('Failed to decode');
    }
}).catch(console.error);
