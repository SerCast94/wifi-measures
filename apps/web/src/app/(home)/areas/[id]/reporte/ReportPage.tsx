import withArea from "@/features/measures/components/withArea";
import { AreaReport } from "@/features/reports/components/AreaReport";
import type { Area } from "@/features/measures/types/areas.types";

interface ReportPageProps {
  area: Area;
}

const ReportPage = ({ area }: ReportPageProps) => {
  return <AreaReport area={area} />;
};

const PageWithArea = withArea(ReportPage) as React.FC<
  Omit<ReportPageProps, "area">
>;

export default PageWithArea;
