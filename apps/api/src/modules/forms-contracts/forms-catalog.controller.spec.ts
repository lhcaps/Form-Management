import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { FormsCatalogController } from './forms-catalog.controller';

describe('FormsCatalogController', () => {
  it('is public so the runtime catalog can be health-checked', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, FormsCatalogController)).toBe(
      true,
    );
  });
});
