import 'dotenv/config';
import { setupWebhook, getProducts, getVariants } from '@/lib/lemonsqueezy';

async function setupLemonSqueezy() {
  console.log('🍋 Setting up LemonSqueezy...\n');

  // 1. Test API connection
  console.log('1. Testing API connection...');
  try {
    const products = await getProducts();
    console.log(`✅ Connected! Found ${products?.length || 0} products\n`);
  } catch (error) {
    console.error('❌ Failed to connect to LemonSqueezy API');
    console.error('   Make sure LEMONSQUEEZY_API_KEY is set correctly');
    process.exit(1);
  }

  // 2. List products and variants
  console.log('2. Listing products and variants...');
  try {
    const products = await getProducts();
    
    for (const product of products || []) {
      console.log(`\nProduct: ${product.attributes.name} (ID: ${product.id})`);
      
      const variants = await getVariants(product.id);
      for (const variant of variants || []) {
        console.log(`  - Variant: ${variant.attributes.name}`);
        console.log(`    ID: ${variant.id}`);
        console.log(`    Price: $${variant.attributes.price / 100}`);
      }
    }
    
    console.log('\n💡 Add these variant IDs to your .env.local:');
    console.log('   LEMONSQUEEZY_STARTER_VARIANT_ID=');
    console.log('   LEMONSQUEEZY_PRO_VARIANT_ID=');
    console.log('   LEMONSQUEEZY_STUDIO_VARIANT_ID=\n');
  } catch (error) {
    console.error('❌ Failed to list products:', error);
  }

  // 3. Setup webhook
  console.log('3. Setting up webhook...');
  try {
    const success = await setupWebhook();
    if (success) {
      console.log('✅ Webhook setup successfully');
      console.log(`   URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/lemonsqueezy`);
    } else {
      console.log('⚠️  Webhook might already exist or setup failed');
    }
  } catch (error) {
    console.error('❌ Failed to setup webhook:', error);
    console.error('   Make sure LEMONSQUEEZY_WEBHOOK_SECRET is set');
  }

  console.log('\n🎉 LemonSqueezy setup complete!');
  console.log('\nNext steps:');
  console.log('1. Create your subscription products in LemonSqueezy dashboard');
  console.log('2. Update variant IDs in your .env.local');
  console.log('3. Test the checkout flow');
}

// Run setup
setupLemonSqueezy().catch(console.error);