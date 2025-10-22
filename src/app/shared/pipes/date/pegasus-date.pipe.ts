import {Pipe, PipeTransform} from '@angular/core';
import {formatDate} from "@angular/common";

export enum PegasusDateFormat {
    Default,          // 15 Jan 2025
    DateTimeShort,    // 15 Jan 2025 14:30
    Time,             // 14:30
    Long,             // Wednesday, 15 January 2025
    ISO,              // 2025-01-15
    ISODateTime,      // 2025-01-15T14:30:00
    MonthYear,        // Jan 2025
    Numeric,          // 15/01/2025
    Compact,          // 15Jan2025
}

/**
 * Centralized Pegasus date pipe.
 * Always use this pipe for date rendering to ensure consistent formatting across the application.
 * Extend PegasusDateFormat enum when introducing new project-wide date formats.
 */
@Pipe({
    name: 'pegasusdate',
    standalone: true
})
export class PegasusDatePipe implements PipeTransform {
    /**
     * Locale to use. Note!
     * Locale is NOT the same as timezone. Locale just defines the formatting style.
     * We do not set the timezone here, so Angular will always use the user's local timezone (taken from Machine settings).
     * @private
     */
    private readonly locale = 'en-GB';

    transform(value: Date | string | number | null | undefined, format: PegasusDateFormat = PegasusDateFormat.Default): unknown {
        if (!value) {
            return '';
        }

        const pattern = this.resolvePattern(format);
        return formatDate(value, pattern, this.locale);
    }

    private resolvePattern(format: PegasusDateFormat): string {
        switch (format) {
            case PegasusDateFormat.Default:
                return 'd MMM y';
            case PegasusDateFormat.DateTimeShort:
                return 'd MMM y HH:mm';
            case PegasusDateFormat.Time:
                return 'HH:mm';
            case PegasusDateFormat.Long:
                return 'EEEE, d MMMM y';
            case PegasusDateFormat.ISO:
                return 'yyyy-MM-dd';
            case PegasusDateFormat.ISODateTime:
                return "yyyy-MM-dd'T'HH:mm:ss";
            case PegasusDateFormat.MonthYear:
                return 'MMM y';
            case PegasusDateFormat.Numeric:
                return 'dd/MM/yyyy';
            case PegasusDateFormat.Compact:
                return 'ddMMMyyyy';
            default:
                return 'd MMM y';
        }
    }
}
