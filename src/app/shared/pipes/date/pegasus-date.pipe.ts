import {Pipe, PipeTransform} from '@angular/core';
import {formatDate} from "@angular/common";

export enum PegasusDateFormat {
    Default = "Default",            // 15 Jan 2025
    DateTimeShort = "DateTimeShort",      // 15 Jan 2025 14:30
    DayOfWeek = "DayOfWeek",              // Monday
    Time = "Time",               // 14:30
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

    transform(value: Date | string | number | null | undefined, format: PegasusDateFormat = PegasusDateFormat.Default): string {
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
            case PegasusDateFormat.DayOfWeek:
                return 'EEEE';
            default:
                return 'd MMM y';
        }
    }
}
