export type PaymentSource = {
	enabled: boolean;
	source: string;
	img: string;
	width: number | 'auto' | `${number}%`;
	height: number | 'auto' | `${number}%`;
	ratio: number | 'auto';
	type: 'link-approval' | 'direct';
};
