import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const githubToken = process.env.GITHUB_TOKEN;

app.get('/', async (req, res) => {
    if (!githubToken) {
        return res.status(500).json({
            status: 'error',
            message: 'GITHUB_TOKEN is missing from container environment variables.'
        });
    }

    try {
        // Authenticated request to GitHub API to demonstrate live secret injection
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'User-Agent': 'deploy-stack-secrets-demo'
            }
        });

        const data = await response.json();

        res.json({
            status: 'success',
            message: 'Secret successfully resolved by ECS from AWS Secrets Manager!',
            authenticated_as: data.login || 'Valid Token',
            token_fingerprint: `${githubToken.substring(0, 4)}...${githubToken.slice(-4)}`
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(port, () => console.log(`Secrets demo server listening on port ${port}`));