import React, { useState, useCallback } from "react";
import { DialogContent, Box } from "@mui/material";
import CustomDialog from "../CustomDialog";
import { styles } from "./styles";
import { TabPanel, SecondaryTabPanel } from "./components/TabPanels";
import { PrimaryTabs, SecondaryTabs } from "./components/Tabs";
import {
  DataSourcesContent,
  ConnectionTypesContent,
  DownloadDataContent,
  CiteUsContent,
  ContributeContent,
  ContactContent,
} from "./components/ContentComponents";

const AboutModal = ({
  showModal,
  onClose,
}: {
  showModal: boolean;
  onClose: () => void;
}) => {
  const [primaryTabValue, setPrimaryTabValue] = useState(0);
  const [secondaryTabValue, setSecondaryTabValue] = useState(0);

  const handlePrimaryTabChange = useCallback((_, newValue: number) => {
    setPrimaryTabValue(newValue);
  }, []);

  const handleSecondaryTabChange = useCallback((_, newValue: number) => {
    setSecondaryTabValue(newValue);
  }, []);

  return (
    <CustomDialog
      showModal={showModal}
      onClose={onClose}
      title="About Nemanode"
    >
      <Box sx={styles.primaryTabsContainer}>
        <PrimaryTabs
          value={primaryTabValue}
          onChange={handlePrimaryTabChange}
        />
      </Box>

      <DialogContent sx={styles.dialogContent}>
        <TabPanel value={primaryTabValue} index={0}>
          <Box sx={styles.secondaryTabsContainer}>
            <SecondaryTabs
              value={secondaryTabValue}
              onChange={handleSecondaryTabChange}
            />
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
