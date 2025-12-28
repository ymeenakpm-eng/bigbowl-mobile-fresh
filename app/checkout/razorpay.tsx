import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';

import { apiJson } from '@/src/utils/api';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

type Params = {
  orderId?: string;
  amountPaise?: string;
  currency?: string;
  bookingId?: string;
  bowlOrderId?: string;
};

export default function RazorpayWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const [verifying, setVerifying] = useState(false);

  const orderId = String(params.orderId ?? '');
  const amountPaise = String(params.amountPaise ?? '');
  const currency = String(params.currency ?? 'INR');
  const bookingId = String(params.bookingId ?? '');
  const bowlOrderId = String(params.bowlOrderId ?? '');

  const html = useMemo(() => {
    const safeKey = String(RAZORPAY_KEY_ID).replace(/"/g, '');
    const safeOrderId = String(orderId).replace(/"/g, '');
    const safeAmt = String(amountPaise).replace(/"/g, '');

    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="font-family: Arial; padding: 16px;">
    <h3>Opening Razorpay...</h3>
    <script>
      function send(msg) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }

      var options = {
        key: "${safeKey}",
        amount: "${safeAmt}",
        currency: "${currency}",
        name: "BigBowl (Test)",
        description: "Test Payment",
        order_id: "${safeOrderId}",
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: false,
        },
        handler: function (response) {
          send({ type: "SUCCESS", payload: response });
        },
        modal: {
          ondismiss: function () {
            send({ type: "DISMISSED" });
          }
        },
        theme: { color: "#3366FF" }
      };

      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          send({ type: "FAILED", payload: resp && resp.error ? resp.error : resp });
        });
        rzp.open();
      } catch (e) {
        send({ type: "ERROR", payload: String(e) });
      }
    </script>
  </body>
</html>`;
  }, [amountPaise, currency, orderId]);

  const verifyOnBackend = async (payload: any) => {
    try {
      setVerifying(true);

      const data: any = await apiJson('/api/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.ok) {
        if (bowlOrderId) {
          router.replace({ pathname: '/bowls-status', params: { bowlOrderId } } as any);
          return;
        }
        router.replace({ pathname: '/checkout/success', params: { orderId, bookingId } } as any);
      } else {
        router.replace({
          pathname: '/checkout/failure',
          params: { orderId, bookingId, bowlOrderId, amountPaise, currency, reason: 'Verification failed' },
        } as any);
      }
    } catch (e: any) {
      router.replace({
        pathname: '/checkout/failure',
        params: { orderId, bookingId, bowlOrderId, amountPaise, currency, reason: String(e?.message ?? 'Verify failed') },
      } as any);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      {verifying ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10 }}>Verifying payment...</Text>
        </View>
      ) : null}

      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        javaScriptCanOpenWindowsAutomatically
        setSupportMultipleWindows
        domStorageEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        onMessage={(event: WebViewMessageEvent) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);

            if (msg.type === 'SUCCESS') {
              verifyOnBackend(msg.payload);
              return;
            }

            const reasonRaw = msg?.payload ? JSON.stringify(msg.payload) : '';
            const reason =
              msg.type === 'DISMISSED'
                ? 'Payment dismissed'
                : msg.type === 'FAILED'
                  ? `Payment failed: ${reasonRaw}`
                  : msg.type === 'ERROR'
                    ? `Checkout error: ${String(msg?.payload ?? '')}`
                    : `Payment cancelled: ${String(msg?.type ?? 'UNKNOWN')}`;

            router.replace({
              pathname: '/checkout/failure',
              params: { orderId, bookingId, bowlOrderId, amountPaise, currency, reason: reason.slice(0, 800) },
            } as any);
          } catch {
            router.replace({
              pathname: '/checkout/failure',
              params: {
                orderId,
                bookingId,
                bowlOrderId,
                amountPaise,
                currency,
                reason: 'Could not parse Razorpay response from WebView',
              },
            } as any);
          }
        }}
      />
    </View>
  );
}
