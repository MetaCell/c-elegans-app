import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import Switch from "./Switch.tsx";
const { gray900, gray500 } = vars;

const Neurons = () => {
  const data = [
    {
      title: "Active neurons",
      neurons: [
        { label: 'ADAR', checked: true, helpText: 'helpText' },
        { label: 'ADAL', checked: true, helpText: 'helpText' },
        { label: 'RIDD', checked: true, helpText: 'helpText' },
      ]
    },
  ];
  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb='1.5rem'>
      <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Neurons
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Search for the neurons and add it to your workspace. This will affect
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
            {section.neurons.map((item, i) => (
              <Switch key={i} data={item} showTooltip={false} />
            ))}
          </Stack>
        ))}
      </Box>
    </Box>
  );
};

export default Neurons;
