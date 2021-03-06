/* MODULES */
import React, { useState, useEffect, useMemo } from 'react';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import en from 'date-fns/locale/en-US';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { errorMessage, successMessage } from '~/util/Message';

/* SERVICES */
import api from '~/services/api';

/* STYLES */
import {
  Container,
  ContainerHeader,
  List,
  ButtonDate,
  TextDate,
  NoMeetapps,
  NoMeetappsText,
} from './styles';

/* COMPONENTS */
import Background from '~/components/Background';
import Header from '~/components/Header';
import Meetapp from '~/components/Meetapp';

export default function Dashboard() {
  /* STATES */
  const [meetapps, setMeetapps] = useState([]);
  const [date, setDate] = useState(new Date());
  const [refreshing] = useState(false);
  const [noMeetapps] = useState([1]);

  const dateFormatted = useMemo(
    () => format(date, 'yyyy MMMM', { locale: en }),
    [date]
  );
  useEffect(() => {
    async function loadMeetapps() {
      try {
        const response = await api.get('meetapps', { params: { date } });
        const data = response.data.map(m => ({
          ...m,
          formattedDate: format(parseISO(m.date), "MMMM d', at' hh'h'mm", {
            locale: en,
          }),
        }));
        setMeetapps(data);
      } catch (e) {
        errorMessage(e);
      }
    }
    loadMeetapps();
  }, [date]);

  /* FUNCTIONS  */
  function handlePrevDay() {
    setDate(subMonths(date, 1));
  }

  function handleNextDay() {
    setDate(addMonths(date, 1));
  }
  function handleRefresh() {
    setDate(subMonths(date, 0));
  }
  async function handleSubscribe(id) {
    try {
      await api.post(`subscriptions/${id}`);
      handleRefresh();
      successMessage('Você se inscreveu neste meetup!');
    } catch (e) {
      errorMessage(e);
    }
  }

  async function handleUninscribe(id) {
    try {
      await api.delete(`subscriptions/${id}`);
      handleRefresh();
      successMessage('Meetup cancelado com sucesso');
    } catch (e) {
      errorMessage(e);
    }
  }

  return (
    <>
      <Background>
        <Header />
        <Container>
          <ContainerHeader>
            <ButtonDate onPress={handlePrevDay}>
              <Icon name="navigate-before" size={36} color="#fff" />
            </ButtonDate>
            <TextDate>{dateFormatted}</TextDate>
            <ButtonDate onPress={handleNextDay}>
              <Icon name="navigate-next" size={36} color="#fff" />
            </ButtonDate>
          </ContainerHeader>
          {meetapps.length > 0 ? (
            <List
              data={meetapps}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <Meetapp
                  data={item}
                  handleSubscribe={() => handleSubscribe(item.id)}
                  handleUninscribe={() => handleUninscribe(item.id)}
                />
              )}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          ) : (
            <List
              data={noMeetapps}
              keyExtractor={item => String(item)}
              renderItem={() => (
                <NoMeetapps>
                  <Icon name="sentiment-dissatisfied" size={40} color="#fff" />
                  <NoMeetappsText>
                    Não há nenhum meetup para este mês
                  </NoMeetappsText>
                </NoMeetapps>
              )}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          )}
        </Container>
      </Background>
    </>
  );
}

Dashboard.navigationOptions = {
  tabBarLabel: 'MeetApps',
  tabBarIcon: ({ tintColor }) => (
    <Icon name="list" size={20} color={tintColor} />
  ),
};
