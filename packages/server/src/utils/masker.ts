import * as MaskData from 'maskdata';

// const emailMask2Options = {
// 	maskWith: "*",
// 	unmaskedStartCharactersBeforeAt: 1, // Set this to 0 to mask the first part
// 	unmaskedEndCharactersAfterAt: 257, // Enter a large number which is always more than the characters after @
// 	maskAtTheRate: false
// };

export const maskEmail = (email: string): string => {
	return MaskData.maskEmail2(email);
};
