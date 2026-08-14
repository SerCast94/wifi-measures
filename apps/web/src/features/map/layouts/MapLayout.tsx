import {
  FlexibleLayout,
  FlexibleLayoutProvider,
  FlexibleLeftPanel,
  FlexibleMainContent,
  FlexibleRightPanel,
} from "@/core/layouts/FlexibleLayout/FlexibleLayout";
// import { FilterPanel } from "../components/filters/FilterPanel";

export const MapLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <FlexibleLayoutProvider
      defaultLeftPanelOpened={false}
      defaultRightPanelOpened={false}
    >
      <FlexibleLayout>
        <FlexibleLeftPanel className="bg-background text-foreground">
          {/* <FilterPanel /> */}
        </FlexibleLeftPanel>
        <FlexibleMainContent>{children}</FlexibleMainContent>
        <FlexibleRightPanel className="bg-background text-foreground">
          {/* <ChannelsPanel /> */}
        </FlexibleRightPanel>
      </FlexibleLayout>
    </FlexibleLayoutProvider>
  );
};
