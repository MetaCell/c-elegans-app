import { Box, DialogContent } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CustomDialog from "../CustomDialog";
import { CiteUsContent, ConnectionTypesContent, ContactContent, ContributeContent, DataSourcesContent } from "./components/ContentComponents";
import { SecondaryTabPanel, TabPanel } from "./components/TabPanels";
import { PrimaryTabs, SecondaryTabs } from "./components/Tabs";
import { styles } from "./styles";

const AboutModal = ({
  showModal,
  onClose,
}: {
  showModal: boolean;
  onClose: () => void;
}) => {
  const [primaryTabValue, setPrimaryTabValue] = useState(0);
  const [secondaryTabValue, setSecondaryTabValue] = useState(0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[data-navigate]");
      if (link) {
        const navigateTo = link.getAttribute("data-navigate");
        if (navigateTo === "dataSources") {
          setPrimaryTabValue(0);
          setSecondaryTabValue(0);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handlePrimaryTabChange = useCallback((_, newValue: number) => {
    setPrimaryTabValue(newValue);
  }, []);

  const handleSecondaryTabChange = useCallback((_, newValue: number) => {
    setSecondaryTabValue(newValue);
  }, []);

  return (
    <CustomDialog showModal={showModal} onClose={onClose} title="About Nemanode">
      <Box sx={styles.primaryTabsContainer}>
        <PrimaryTabs value={primaryTabValue} onChange={handlePrimaryTabChange} />
      </Box>

      <DialogContent sx={styles.dialogContent}>
        <TabPanel value={primaryTabValue} index={0}>
          <Box sx={styles.secondaryTabsContainer}>
            <SecondaryTabs value={secondaryTabValue} onChange={handleSecondaryTabChange} />
          </Box>

          <SecondaryTabPanel value={secondaryTabValue} index={0}>
            <DataSourcesContent />
          </SecondaryTabPanel>

          <SecondaryTabPanel value={secondaryTabValue} index={1}>
            <ConnectionTypesContent />
          </SecondaryTabPanel>

          {/* <SecondaryTabPanel value={secondaryTabValue} index={2}>
            <DownloadDataContent />
          </SecondaryTabPanel> */}

          <SecondaryTabPanel value={secondaryTabValue} index={2}>
            <CiteUsContent />
          </SecondaryTabPanel>
        </TabPanel>

        <TabPanel value={primaryTabValue} index={1}>
          <ContributeContent />
        </TabPanel>

        <TabPanel value={primaryTabValue} index={2}>
          <ContactContent />
        </TabPanel>
      </DialogContent>
    </CustomDialog>
  );
};

export default AboutModal;
