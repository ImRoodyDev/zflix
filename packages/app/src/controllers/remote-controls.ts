// External imports
import { BaseRemoteControl, Directions } from 'react-native-cross-elements';


export enum SupportedKeys {
	ArrowRight = 'ArrowRight',
	ArrowLeft = 'ArrowLeft',
	ArrowUp = 'ArrowUp',
	ArrowDown = 'ArrowDown',
	Enter = 'Enter',
	Backspace = 'Backspace',
	LongEnter = 'LongEnter',
}

export const MapSupportedKeys: Readonly<Record<SupportedKeys, Directions>> = {
	[SupportedKeys.ArrowUp]: Directions.UP,
	[SupportedKeys.ArrowDown]: Directions.DOWN,
	[SupportedKeys.ArrowLeft]: Directions.LEFT,
	[SupportedKeys.ArrowRight]: Directions.RIGHT,
	[SupportedKeys.Enter]: Directions.ENTER,
	[SupportedKeys.Backspace]: Directions.UNSPECIFIED,
	[SupportedKeys.LongEnter]: Directions.LONG_ENTER,
};

export class RemoteControlManager extends BaseRemoteControl<SupportedKeys> {
	private isEnterKeyDown = false;
	private longEnterTimeout: NodeJS.Timeout | number | null = null;

	constructor() {
		super();
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	}

	private handleKeyDown = (event: KeyboardEvent) => {
		// logger.debug(`[RemoteControlManager] Key down: ${event.code}`);
		if (event.code === SupportedKeys.Enter) {
			if (!this.isEnterKeyDown) {
				this.isEnterKeyDown = true;
				this.handleLongEnter();
			}
			return;
		}
		this.eventEmitter.emit('keyDown', event.code as SupportedKeys);
	};

	private handleKeyUp = (event: KeyboardEvent) => {
		if (event.code === SupportedKeys.Enter) {
			this.isEnterKeyDown = false;
			if (this.longEnterTimeout) {
				clearTimeout(this.longEnterTimeout);
				this.eventEmitter.emit('keyDown', event.code);
			}
		}
	};

	private handleLongEnter = () => {
		this.longEnterTimeout = setTimeout(() => {
			this.eventEmitter.emit('keyDown', SupportedKeys.LongEnter);
			this.longEnterTimeout = null;
		}, 500);
	};
}
