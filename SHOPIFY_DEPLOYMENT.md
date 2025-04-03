# Deploying to Shopify

This guide explains how to deploy the AI Product Customizer as a custom Shopify app.

## Prerequisites

- A Shopify Partner account (sign up at [partners.shopify.com](https://partners.shopify.com))
- A Shopify development store
- Hosting for your backend (Heroku, Vercel, Digital Ocean, etc.)

## Step 1: Create a custom Shopify app

1. Log in to your [Shopify Partner Dashboard](https://partners.shopify.com)
2. Navigate to Apps → Create app
3. Select "Custom app" and provide a name (e.g., "AI Product Customizer")
4. Set the App URL to the domain where your app will be hosted
5. Add redirect URLs (your-domain.com/auth/callback)
6. Under "Admin API integration," select the necessary scopes:
   - `read_products`
   - `write_products`
   - `read_themes`
   - `write_themes`
7. Click "Create app" and note your API credentials

## Step 2: Deploy the backend (U-2-Net server)

### Option A: Deploy to Heroku

1. Create a new Heroku app
2. Add Python buildpack
3. Set up Git repo with your code:
   ```
   git clone https://github.com/raakesh-m/aiprod.git
   cd aiprod
   ```
4. Add a `Procfile` to the root with:
   ```
   web: cd python_backend && gunicorn -w 4 --bind 0.0.0.0:$PORT simplified_u2net_server:app
   ```
5. Deploy with Git: `git push heroku main`

### Option B: Deploy to Digital Ocean App Platform

1. Create a new app on Digital Ocean App Platform
2. Connect your Git repository: https://github.com/raakesh-m/aiprod
3. Set the source directory to `/python_backend`
4. Set the build command to `pip install -r requirements.txt && python download_models.py`
5. Set the run command to `gunicorn --workers 2 --bind 0.0.0.0:$PORT simplified_u2net_server:app`
6. Deploy the application

## Step 3: Deploy the Remix frontend

### Option A: Deploy to Vercel

1. Create a new project on Vercel
2. Connect your Git repository: https://github.com/raakesh-m/aiprod
3. Set the framework preset to "Remix"
4. Add environment variables:
   - `SHOPIFY_API_KEY` (from your Shopify Partner dashboard)
   - `SHOPIFY_API_SECRET` (from your Shopify Partner dashboard)
   - `SHOPIFY_APP_URL` (your frontend URL)
   - `BACKEND_URL` (your U-2-Net server URL)
   - `SESSION_SECRET` (generate a secure random string)
5. Deploy the application

### Option B: Deploy to Netlify

1. Create a new site on Netlify
2. Connect your Git repository: https://github.com/raakesh-m/aiprod
3. Set the build command to `npm run build`
4. Set the publish directory to `public`
5. Add environment variables (same as for Vercel)
6. Deploy the application

## Step 4: Connect your app to your Shopify store

1. Go to your development store admin panel
2. Navigate to Apps → Manage custom apps → Upload app
3. Enter your App API key (from the Partner dashboard)
4. Install the app when prompted
5. Verify that the app is working correctly in your store

## Step 5: Create a theme app extension (optional)

For deeper integration with Shopify themes:

1. In your project, create a folder structure for the extension:
   ```
   shopify/
   └── extensions/
       └── product-customizer/
           ├── assets/
           ├── blocks/
           └── snippets/
   ```

2. Add your extension files, including:
   - Block definitions
   - JavaScript assets
   - Liquid templates

3. Use the Shopify CLI to push your extension:
   ```
   shopify extension push
   ```

## Troubleshooting

- **CORS issues**: Ensure your backend has CORS properly configured to allow requests from your Shopify store domain
- **API Key errors**: Double-check your API keys in environment variables
- **Backend connection issues**: Verify that your frontend can reach your backend server

## Production Considerations

1. **Scalability**: Consider using a more robust server setup for high traffic
2. **Model Loading**: The U-2-Net model can be resource-intensive - ensure your server has adequate memory
3. **Caching**: Implement caching for processed images to improve performance
4. **Error Handling**: Add comprehensive error reporting for production use
5. **Monitoring**: Set up monitoring and alerts for your backend server

## Resources

- [Shopify Custom App Documentation](https://shopify.dev/apps/custom-apps)
- [Shopify Theme Extensions](https://shopify.dev/themes/app-extensions)
- [Remix Deployment](https://remix.run/docs/en/main/guides/deployment)
- [Project Repository](https://github.com/raakesh-m/aiprod) 