import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses localStorage by default', () => {
    service.opslaan('key', 'local value');

    expect(service.ophalen<string>('key')).toBe('local value');
    expect(sessionStorage.getItem('key')).toBeNull();
  });

  it('can use sessionStorage when requested', () => {
    service.opslaan('key', 'session value', service.vervalTijdMinuten, 'session');

    expect(service.ophalen<string>('key', 'session')).toBe('session value');
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('removes values from the selected storage', () => {
    service.opslaan('local-key', 'local value');
    service.opslaan('session-key', 'session value', service.vervalTijdMinuten, 'session');

    service.verwijder('local-key');
    service.verwijder('session-key', 'session');

    expect(localStorage.getItem('local-key')).toBeNull();
    expect(sessionStorage.getItem('session-key')).toBeNull();
  });
});
