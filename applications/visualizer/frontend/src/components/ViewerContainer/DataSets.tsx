import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import Switch from "./Switch.tsx";

const { gray900, gray500 } = vars;

const data = [
  {
    title: "Development stage 1",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '23 hours after birth', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '27 hours after birth', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
    ]
  },
  {
    title: "Adult",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '50 hours after birth', helpText: 'helpText' },
    ]
  }
];

const DataSets = () => {
  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb='1.5rem'>
        <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Datasets
        </Typography>
        
        <Typography variant="body1" component="p" color={gray500}>
          Toggle on and off to view datasets on the workspace. This will affect
          all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown />
      <Box sx={{
        height: "100%",
        overflow: 'auto'
      }}>
        {data.map((section, index) => (
          <Stack key={index} spacing='.5rem' p='.25rem' mt='1rem'>
            <Typography color={gray500} variant='subtitle1' padding='.5rem'>
              {section.title}
            </Typography>
            {section.dataSets.map((item, i) => (
              <Switch key={i} data={item} />
            ))}
          </Stack>
        ))}
      </Box>
    </Box>
  );
};

export default DataSets;
