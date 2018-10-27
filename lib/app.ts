import {Inject, InjectionToken, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID} from '@angular/core';
import {LIB_KEY, LIB_KEY_CASE_SENSITIVE, LIB_KEY_SEPARATOR} from './constants/lib';
import {STORAGE} from './enums/storage';
import {LocalStorageService, SessionStorageService} from './services/index';
import {WebStorageHelper} from './helpers/webStorage';
import {IWebstorageConfig, WebstorageConfig} from './interfaces/config';
import {KeyStorageHelper} from './helpers/keyStorage';
import {StorageObserverHelper} from './helpers/storageObserver';
import { isPlatformBrowser } from '@angular/common';

export * from './interfaces/index';
export * from './decorators/index';
export * from './services/index';

export const WEBSTORAGE_CONFIG = new InjectionToken('WEBSTORAGE_CONFIG');

@NgModule({
	declarations: [],
	providers: [SessionStorageService, LocalStorageService],
	imports: []
})
export class Ng2Webstorage {

	static forRoot(config?:IWebstorageConfig):ModuleWithProviders {
		return {
			ngModule: Ng2Webstorage,
			providers: [
				{
					provide: WEBSTORAGE_CONFIG,
					useValue: config
				},
				{
					provide: WebstorageConfig,
					useFactory: provideConfig,
					deps: [
						WEBSTORAGE_CONFIG
					]
				}
			]
		};
	}

	constructor(
		private ngZone:NgZone,
		@Inject(PLATFORM_ID) private _platformId: string,
		@Optional() @Inject(WebstorageConfig) config:WebstorageConfig
	) {
		if(config) {
			KeyStorageHelper.setStorageKeyPrefix(config.prefix);
			KeyStorageHelper.setStorageKeySeparator(config.separator);
			KeyStorageHelper.setCaseSensitivity(config.caseSensitive);
		}

		this.initStorageListener();
		StorageObserverHelper.initStorage();
	}

	private initStorageListener() {
		if(typeof window !== 'undefined' && isPlatformBrowser(this._platformId)) {
			window.addEventListener('storage', (event:StorageEvent) => this.ngZone.run(() => {
				let storage:STORAGE = window.sessionStorage === event.storageArea ? STORAGE.session : STORAGE.local;
				if(event.key === null) WebStorageHelper.refreshAll(storage);
				else WebStorageHelper.refresh(storage, event.key);
			}));
		}
	}
}

export function provideConfig(config:IWebstorageConfig):WebstorageConfig {
	return new WebstorageConfig(config);
}
