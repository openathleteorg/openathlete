-- AlterTable
ALTER TABLE "athlete_settings" ADD COLUMN     "pinned_metrics" "metric_type"[] DEFAULT ARRAY['HRV_LAST_NIGHT_AVG', 'HR_REST', 'SLEEP_DURATION', 'SLEEP_SCORE', 'WEIGHT']::"metric_type"[];
