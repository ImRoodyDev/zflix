import { PaymentSource } from '@/types/payments';

export const PAYMENT_SOURCES: PaymentSource[] = [
	{
		enabled: true,
		source: 'PAYPAL',
		img: 'payments/paypal.png',
		width: 60 * 1.538,
		height: 'auto',
		ratio: 1.538,
		type: 'link-approval',
	},
	{
		enabled: true,
		source: 'STRIPE',
		img: 'payments/stripe.png',
		width: 40 * 1.538,
		height: '100%',
		ratio: 'auto',
		type: 'link-approval',
	},
];
