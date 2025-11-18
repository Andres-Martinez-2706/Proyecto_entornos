package uis.edu.co.appointments.util;

import java.time.LocalDate;

public class DateRangeHelper {
    
    public static class DateRange {
        private final LocalDate start;
        private final LocalDate end;
        
        public DateRange(LocalDate start, LocalDate end) {
            this.start = start;
            this.end = end;
        }
        
        public LocalDate getStart() { return start; }
        public LocalDate getEnd() { return end; }
    }
    
    /**
     * Obtener rango de fechas según período
     * @param period - "7d", "30d", "6m", "1y", "custom"
     * @param customStart - Fecha inicio personalizada (si period es "custom")
     * @param customEnd - Fecha fin personalizada (si period es "custom")
     */
    public static DateRange getRange(String period, LocalDate customStart, LocalDate customEnd) {
        LocalDate now = LocalDate.now();
        LocalDate start, end = now;
        
        if (period == null || period.isEmpty()) {
            period = "30d";
        }
        
        switch (period.toLowerCase()) {
            case "7d":
                start = now.minusDays(7);
                break;
            case "30d":
                start = now.minusDays(30);
                break;
            case "6m":
                start = now.minusMonths(6);
                break;
            case "1y":
                start = now.minusYears(1);
                break;
            case "custom":
                if (customStart == null || customEnd == null) {
                    throw new IllegalArgumentException(
                        "Para período 'custom' debe proporcionar customStart y customEnd"
                    );
                }
                start = customStart;
                end = customEnd;
                break;
            default:
                start = now.minusDays(30);
        }
        
        return new DateRange(start, end);
    }
}