import { createTheme } from "@mui/material/styles";
import { vars } from "./variables.ts";
import maximizeIcon from "../assets/maximize_icon.svg";
import minimizeIcon from "../assets/minimize_icon.svg";
const {
  primaryFont,
  primary500,
  primaryPurple600,
  gray800,
  white,
  baseContainerBg,
  primaryPurple300,
  primaryPurple700,
  gray600,
  gray700,
  gray400,
  gray100,
  gray25,
  gray200,
  primaryPurple50,
  gray700A,
  gray200S,
  buttonShadow,
  gray50,
  gray500,
  gray300,
  primaryPurple500,
  primaryPurple200,
  primaryPurple25,
  primaryPurple100,
  gray950,
  primaryBlue700,
  primaryBlue50,
  primaryBlue200
} = vars

const theme = createTheme({
  typography: {
    allVariants: {
      fontFamily: primaryFont,
      letterSpacing: 'normal',
    },
    h2: {
      fontSize: '1.125rem',
      fontWeight:600,
      color: gray800,
      lineHeight: '1.75rem'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: '150%',
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.25rem',
      color: gray700,
    },
    body2: {
      color: gray700,
    },
    h5: {
      fontSize: '1rem',
      fontWeight:600,
      lineHeight: '1.5rem'
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight:600,
      color: gray800,
    },
    caption: {
      fontSize: '0.875rem',
      fontWeight: 400,
      color: gray700A,
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight:500,
      color: gray700A
    },
    button: {
      fontSize: '0.875rem',
      color: primaryPurple600,
      fontWeight: 600,
      textTransform: 'none'
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: `
      ::-webkit-scrollbar {
        width: 0.8125rem;
        height: 0.5rem;
      }
      ::-webkit-scrollbar-thumb {
        height: 0.5rem;
        border: 0.25rem solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 0.5rem;
        background-color: ${gray200S};
      }
      ::-webkit-scrollbar-button {
        width: 0;
        height: 0;
        display: none;
      }
      ::-webkit-scrollbar-corner {
        background-color: transparent;
      }
      * {
          box-sizing: border-box !important;
          margin: 0;
          font-family: ${primaryFont};
          padding: 0;
        }
      body {
          background: ${gray800};
          scrollbar-width: thin;
          scrollbar-color: ${gray200S} transparent;
        }
      .MuiContainer {
          display: flex;
          width: 100%;
          background: ${baseContainerBg};
          height: calc(100vh - 3.25rem);
          margin-top: 3.25rem;
          overflow: hidden;
          padding: 1rem;
          border-radius: 1rem 1rem 0 0;
        }
        .MuiContainer:has(> .database-summary) {
          padding: 0;
          overflow: auto
        }
        .flexlayout__layout {
          overflow: inherit;
        }
        .flexlayout__border_bottom {
          border: 0;
          background: transparent;
        }
        .flexlayout__tab {
          margin-top: 0.4em;
          border-radius: 0 0.5rem 0.5rem 0.5rem;
        }
        .flexlayout__tabset {
          background: transparent;
          .flexlayout__tabset_tabbar_outer_top {
            border-bottom: none;
          }
          .flexlayout__tab_toolbar_button-min {
            background: transparent url(${maximizeIcon}) no-repeat right;
            cursor: pointer;
          }
          .flexlayout__tab_toolbar_button-max {
            background: transparent url(${minimizeIcon}) no-repeat right;
            cursor: pointer;
          }
          .flexlayout__tabset_tabbar_outer {
            background-color: transparent;
            height: 2rem !important;
            .flexlayout__tab_toolbar_button {
              &:focus {
                outline: 0;
              }
            }
            .flexlayout__tab_button {
              margin: 0;
              border-radius: 0.5rem 0.5rem 0rem 0rem;
              padding: 0.25rem 0.5rem;
              margin-right: 0.25rem;
              color: ${gray800};
              min-width: 9.375rem;
              font-size: 0.875rem;
              font-weight: 600;
              &.flexlayout__tab_button--selected {
                background-color: ${white};
                &:hover {
                  background-color: ${white};
                }
              }
            }
          }
        }

      `
    },
    MuiChip: {
      styleOverrides: {
        root: {
          width: 'fit-content',
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: '1.125rem',
          height: '1.375rem',
          borderRadius: '1rem',
          padding: '0 0.5rem',
          fontFamily: primaryFont,

          '&:active': {
            boxShadow: 'none'
          }
        },
        label: {
          padding: 0
        },
        outlinedPrimary: {
          background: primaryPurple50,
          borderColor: primaryPurple200,
          color: primaryPurple700
        },
        outlinedSecondary: {
          color: primaryBlue700,
          backgroundColor: primaryBlue50,
          borderColor: primaryBlue200,
        },
        outlined: {
          color: primaryPurple700,
          backgroundColor: primaryPurple50,
          borderColor: primaryPurple200,

          '&.link': {
            backgroundColor: primaryPurple25,
            borderColor: primaryPurple100,
            padding: '0.125rem 0.625rem'
          }
        }
      }
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: primary500
        }
      }
    },
    MuiAppBar: {
      styleOverrides : {
        root: {
          background: gray800,
          boxShadow: 'none',
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        arrow: {
          color: gray950,
        },
        popper: {
          '&[data-popper-placement*="right"]': {
            '& .MuiTooltip-tooltip': {
              marginLeft: '0 !important'
            }
          }
        },
        tooltip: {
          background: gray950,
          borderRadius: '0.5rem',
          fontFamily: primaryFont,
          padding: '0.375rem 0.75rem'
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '3.25rem !important',
          '& .MuiButton-root': {
            color: 'white',
            margin: 0,
            fontWeight: 500,
            marginRight: 6,
            border: '0.0625rem solid transparent',
            textTransform: 'none',
            padding: '0.2rem 0.875rem',
            '&.active': {
              background: gray700,
              borderColor: primaryPurple700,
            },
            '&:focus': {
              borderColor: 'transparent',
              outline: '0.25rem solid #9B18D83D',
            },
            '&:hover': {
              background: gray700,
            },
          }
        }
      }
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '& .MuiTouchRipple-root' : {
            display: 'none',
          },
          '&:focus': {
            outline: 0,
          }
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
        },
        paper: {
          borderRadius: 12,
          maxWidth: '34.375rem',
          '& .MuiIconButton-root' : {
            color: gray400,
            borderRadius: 0,
            padding: '0.25rem',
            '&:hover': {

            }
          },
          '& .MuiSvgIcon-root': {
            width: '0.85em',
            height: '0.85em',
          }
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: gray800,
          background: gray25,
          padding: '0.813rem 1.5rem'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderColor: gray100,
          borderBottom: 0,
          '& .MuiBox-root': {
            margin: '0.4rem 0 1rem',
            '&.MuiBoxMetacell-footer' : {
              display: 'flex',
              margin: 0,
              borderTop: `0.0625rem solid ${gray100}`,
              padding:'1.5rem 0 0.5rem',
              '& p': {
                fontSize: '0.75rem',
                marginRight: '1rem'
              }
            },
            '& p': {
              color: gray600,
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: buttonShadow,
          fontSize: '0.875rem',
          fontWeight: 600,
          lineHeight: '1.25rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.25rem',
          gap: '0.25rem',
        },
        contained: {
          boxShadow: 'none',
          background: primaryPurple500,
          color: white,
          border: `1px solid ${primaryPurple500}`,
          '&:hover': {
            boxShadow: 'none',
            border: `1px solid ${primaryPurple600}`,
            background: primaryPurple600
          }
        },
        outlined: {
            border: `1px solid ${gray100}`,
            background: white,
            color: gray600,
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem'
            },
          '&:hover': {
          border: `1px solid ${gray100}`,
          background: gray50,
          }
        },
        text: {
          boxShadow: 'none',
          color: gray500
        },
        containedPrimary: {
          background: primaryPurple500,
          color: white
        }
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '& .MuiButtonBase-root': {
            borderRadius: '0.25rem',
            border: `1px solid ${gray100}`,
            background: white,
            color: gray600,
            padding: '0.375rem',

            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem'
            }
          }
        }
      }
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        li: {
          '& a': {
            color: gray500,
            cursor: 'pointer',
            fontSize: '0.875rem',
          },
          '&:last-child': {
            '& p': {
              color: primaryPurple600,
              fontWeight: 500,
              fontSize: '0.875rem',
            }
          }
        },
        separator: {
          color: gray300
        }
      }
    },
    MuiSvgIcon: {
      styleOverrides: {
        fontSizeSmall: {
          fontSize: '1rem'
        },
      }
    },
    MuiAccordion: {
      styleOverrides: {
       root: {
         boxShadow: 'none',
         "&:before":{
           display: 'none'
         },
         '& .MuiAccordionSummary-root':{
           paddingLeft: 0,
           gap: '.5rem',
           flexDirection: 'row-reverse',
           '& .MuiTypography-root': {
             fontSize: '0.875rem',
             color: gray700A,
             fontWeight: 500
           },
           '& .MuiAccordionSummary-expandIconWrapper':{
             color: gray700A,
             fontSize: '1rem',
             '&.Mui-expanded': {
               transform: 'rotate(90deg)',
             }
           },
         },
       },
      }
    },
    MuiPaper: {
      styleOverrides: {
       root: {
         boxShadow: 'none'
       },
      }
    },
    MuiTable: {
      styleOverrides: {
       root: {

       }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
       root: {
         borderRadius: '0.25rem',
          border: `1px solid ${gray200}`,

         '& .MuiTableCell-root': {
           borderBottom: `1px solid ${gray100}`,
           color: gray600,
           fontWeight: 400,
           padding: '0.625rem .75rem 0.625rem .75rem'
         }
       }
      }
    },
    MuiTab: {
      styleOverrides: {
       root: {
         color: gray500,
         fontSize: '0.875rem',
         fontWeight: 600,
         lineHeight: '1.25rem',
         padding: '0.5rem 0.75rem',
         minHeight: 'unset',

          '&.Mui-selected': {
            borderRadius: '0.25rem',
            color: primaryPurple600
          },
       },
      }
    },
    MuiTabs: {
      styleOverrides: {
       root: {
         minHeight: 'unset',
         '& .MuiTabs-indicator': {
           backgroundColor: primaryPurple500,
           height: '1px'
         },
         '&.custom-tabs': {
           '& .MuiTabs-indicator': {
             display: 'none'
           },
           '& .MuiTab-root': {
             padding: '0.5rem 0.75rem',
             '&.Mui-selected': {
               background: gray50,
               color: gray700,
               borderRadius: '0.25rem',
               boxShadow: buttonShadow,
             },
           }
         }
       },
        flexContainer: {
         justifyContent: 'center'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
       root: {
         borderColor: gray100
       },
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          height: '2.25rem',
          paddingTop: 0,
          paddingBottom: 0
        },
        root: {
          border: `0.0625rem ${gray100} solid`,
          // boxShadow: "0 0 0.25rem rgba(0, 0, 0, 0.1)",
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent'
            }
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryPurple300,
            }
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: gray600,
          fontWeight: 600,
          '&.Mui-focused': {
            color: primaryPurple600,
          }
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiSvgIcon-root': {
            marginRight: '0.5rem',
            marginLeft: '0.875rem',
            color: gray600,
          }
        }
      }
    },
  }
});

export default theme;