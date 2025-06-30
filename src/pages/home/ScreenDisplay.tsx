
import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

interface Props {
    totalCost: string;
    fuelVolume: string;
    fuelUnitPrice: string;
}
export default function ScreenDisplay({
    totalCost,
    fuelVolume,
    fuelUnitPrice
}: Props) {
    return (
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', 
        // margin: "0 50% 0 auto" 
        }}>
            <ListItem alignItems="flex-start" key={"total-cost"}>
                <ListItemText
                    primary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline' }}
                                variant="h6"
                            >
                                Tiền
                            </Typography>

                        </React.Fragment>
                    }
                    secondary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline', fontFamily: "Consolas, monospace", fontSize: "2rem", fontWeight: "bold"  }}
                                variant='body2'
                                color="text.primary"
                            >
                                {totalCost}
                            </Typography>

                        </React.Fragment>
                    }
                />
            </ListItem>
            <Divider variant="middle" component="li" />

            <ListItem alignItems="flex-start" key={"volume"}>
                <ListItemText
                    primary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline' }}
                                variant="h6"
                            >
                                Lít
                            </Typography>

                        </React.Fragment>
                    }
                    secondary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline', fontFamily: "Consolas, monospace", fontSize: "2rem", fontWeight: "bold"  }}
                                variant='body2'
                                color="text.primary"
                            >
                               {fuelVolume}
                            </Typography>

                        </React.Fragment>
                    }
                />
            </ListItem>
            <Divider variant="middle" component="li" />

            <ListItem alignItems="flex-start" key={"unit-price"}>
                <ListItemText
                    primary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline' }}
                                variant="h6"
                            >
                                Đơn giá
                            </Typography>

                        </React.Fragment>
                    }
                    secondary={
                        <React.Fragment>
                            <Typography
                                sx={{ display: 'inline', fontFamily: "Consolas, monospace",  fontSize: "2rem", fontWeight: "bold" }}
                                  variant='body2'
                                color="text.primary"
                            >
                               {fuelUnitPrice}
                            </Typography>

                        </React.Fragment>
                    }
                />
            </ListItem>
            <Divider variant="middle" component="li" />
        </List>
    );
}