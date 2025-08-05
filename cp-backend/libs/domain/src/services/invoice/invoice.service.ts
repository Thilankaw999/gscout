import { Injectable } from '@nestjs/common';
import { isNil } from 'lodash';
import { HasOwnProperty, timeStringToFloat } from '@app/common';

@Injectable()
export class InvoiceService {
  constructor() {}

  calculateClaimAmount(
    quantity: { duration?: string; units?: number },
    price: number,
  ): number {
    if (isNil(price) || isNaN(price) || isNil(quantity)) {
      return 0;
    }

    // Units check
    if (HasOwnProperty(quantity, 'units') && !isNil(quantity.units)) {
      const unitValue = +quantity.units;
      if (!isNaN(unitValue)) {
        return +(unitValue * price).toFixed(2);
      }
      return 0;
    }

    if (
      HasOwnProperty(quantity, 'duration') &&
      !isNil(quantity.duration) &&
      quantity.duration !== ''
    ) {
      try {
        const durationValue = timeStringToFloat(quantity.duration);
        return +(durationValue * price).toFixed(2);
      } catch {
        return 0;
      }
    }

    return 0;
  }
}
