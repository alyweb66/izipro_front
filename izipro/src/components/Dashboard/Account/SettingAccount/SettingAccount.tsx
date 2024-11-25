// React and React hooks
import { useEffect, useRef, useState } from 'react';

// Apollo Client and GraphQL mutations
import { useMutation } from '@apollo/client';
import {
  DELETE_USER_HAS_JOB_MUTATION,
  USER_HAS_JOB_MUTATION,
  USER_SETTING_MUTATION,
} from '../../../GraphQL/UserMutations';

// Custom hooks for queries
import {
  useQueryCategory,
  useQueryJobData,
  useQueryJobs,
} from '../../../Hook/Query';

// State management
import { userDataStore } from '../../../../store/UserData';

// Type definitions
import { CategoryProps, JobProps } from '../../../../Type/Request';

// Local components and assets
import Spinner from '../../../Hook/Spinner';

// Styling imports
import './SettingAccount.scss';
import SelectBox from '../../../Hook/SelectBox';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { subscriptionDataStore } from '../../../../store/subscription';
import { SubscriptionProps } from '../../../../Type/Subscription';
import ListItem from '@mui/material/ListItem';
import Collapse from '@mui/material/Collapse';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import { TransitionGroup } from 'react-transition-group';
import { categoriesJobStore, jobsStore } from '../../../../store/Job';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Popper from '@mui/material/Popper';
import { autocompleteSx, popperSx } from '../../../Hook/SearchStyle';

function SettingAccount() {
  //store
  const id = userDataStore((state) => state.id);
  const [jobs, setJobs] = userDataStore((state) => [
    state.jobs || [],
    state.setJobs,
  ]);
  const [settings, setSettings] = userDataStore((state) => [
    state.settings || [],
    state.setSettings,
  ]);
  const role = userDataStore((state) => state.role);
  const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore(
    (state) => [state.subscription, state.setSubscription]
  );
  const [categoriesJobsStore, setCategoriesJobsStore] = categoriesJobStore(
    (state) => [state.categories, state.setcategories]
  );
  const [jobStore, setJobsStore] = jobsStore((state) => [
    state.jobs,
    state.setJobs,
  ]);

  // State
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [wishListJob, setWishListJob] = useState<JobProps[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobProps[]>([]);
  const [radius, setRadius] = useState(settings[0]?.range || 0);
  const [message, setMessage] = useState('');
  const [skip, setSkip] = useState(false);
  const [jobError, setJobError] = useState('');

  // query
  const { loading: categoryLoading, categoriesData } = useQueryCategory(
    categoriesJobsStore.length > 0
  );
  const { loading: jobLoading, jobData } = useQueryJobs(jobStore.length > 0);
  const { loading: jobDataLoading, jobs: jobDataName } = useQueryJobData(
    jobs ? jobs : [],
    skip
  );

  // mutation
  const [
    createUserJob,
    { loading: userJobLoading, error: errorCreateUserJob },
  ] = useMutation(USER_HAS_JOB_MUTATION);
  const [
    deleteUserJob,
    { loading: deleteJobLoading, error: errorDeleteUserJob },
  ] = useMutation(DELETE_USER_HAS_JOB_MUTATION);
  const [userSetting, { loading: settingLoading, error: errorUserSetting }] =
    useMutation(USER_SETTING_MUTATION);

  // useRef
  const inputRef = useRef<HTMLInputElement | null>(null); // Create a reference to the input element to close keyboard on mobile

  // function to delete job in the database
  const handleDeleteJob = (
    jobId: number,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    event?.stopPropagation();

    // update selectedJob and jobs
    setSelectedJob(selectedJob.filter((job) => job.id !== jobId));
    setJobs(jobs.filter((job) => job.job_id !== jobId));

    deleteUserJob({
      variables: {
        input: {
          user_id: id,
          job_id: [jobId],
        },
      },
    });

    // Update subscription store if exist
    if (
      subscriptionStore.some(
        (subscription) => subscription.subscriber === 'jobRequest' && id > 0
      )
    ) {
      subscriptionStore.forEach((subscription) => {
        if (
          subscription.subscriber === 'jobRequest' &&
          Array.isArray(subscription.subscriber_id)
        ) {
          // replace the old subscription with the new one
          const newSubscriptionStore = subscriptionStore.map(
            (subscription: SubscriptionProps) =>
              subscription.subscriber === 'jobRequest'
                ? {
                    ...subscription,
                    subscriber_id: subscription.subscriber_id.filter(
                      (id: number) => id !== jobId
                    ),
                  }
                : subscription
          );
          if (newSubscriptionStore) {
            setSubscriptionStore(newSubscriptionStore);
          }
        }
      });
    }

    if (errorDeleteUserJob) {
      throw new Error('Error while deleting job');
    }
  };

  // function to submit job
  const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Filter wishListJob to get only the jobs whose IDs are not already in jobs
    const newJobIds = wishListJob
      .filter((job) => !jobs.some((jobStore) => jobStore.job_id === job.id))
      .map((job) => job.id);

    const totalJob = [
      ...(selectedJob || []),
      ...wishListJob.filter((job) => newJobIds.includes(job.id)),
    ];

    if (totalJob.length >= 6) {
      setJobError('Vous ne pouvez pas séléctionner plus de 5 métiers');
      /* setTimeout(() => {
				setJobError('');
			}, 6000); */
      return;
    }
    // Add new jobs to selectedJob
    setSelectedJob([
      ...(selectedJob || []),
      ...wishListJob.filter((job) => newJobIds.includes(job.id)),
    ]);

    // Update jobs in the store
    setJobs([...jobs, ...newJobIds.map((id) => ({ job_id: id }))]);

    // add job to the database
    if (newJobIds.length === 0) {
      setWishListJob([]);
      setSelectedCategory(0);
      return;
    }
    createUserJob({
      variables: {
        input: {
          user_id: id,
          job_id: newJobIds,
        },
      },
    }).then((response) => {
      if (response.errors && response.errors.length > 0) {
        setJobError("Erreur lors de l'ajout du métier");
      }
      setJobError('');
      setWishListJob([]);
      setSelectedCategory(0);
      // Update subscription store if exist
      if (
        subscriptionStore.some(
          (subscription) => subscription.subscriber === 'jobRequest'
        ) &&
        id > 0
      ) {
        subscriptionStore.forEach((subscription) => {
          if (
            subscription.subscriber === 'jobRequest' &&
            Array.isArray(subscription.subscriber_id)
          ) {
            // replace the old subscription with the new one
            const newSubscriptionStore = subscriptionStore.map(
              (subscription: SubscriptionProps) =>
                subscription.subscriber === 'jobRequest'
                  ? {
                      ...subscription,
                      subscriber_id: [
                        ...subscription.subscriber_id,
                        ...newJobIds,
                      ],
                    }
                  : subscription
            );
            if (newSubscriptionStore) {
              setSubscriptionStore(newSubscriptionStore);
            }
          }
        });
      } else if (
        !subscriptionStore.some(
          (subscription) => subscription.subscriber === 'jobRequest'
        ) &&
        id > 0
      ) {
        // Create a new subscription
        setSubscriptionStore([
          ...subscriptionStore,
          {
            subscriber: 'jobRequest',
            subscriber_id: newJobIds,
            user_id: id,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    });

    if (errorCreateUserJob) {
      throw new Error('Error while adding job');
    }
  };

  // function to validate the range
  const handleValidateRange = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    userSetting({
      variables: {
        userSettingId: id,
        input: {
          range: radius,
          user_id: id,
        },
      },
    }).then(() => {
      setSettings([{ range: radius }]);
      setMessage('distance validée');
      setTimeout(() => {
        setMessage('');
      }, 5000);
    });

    if (errorUserSetting) {
      throw new Error('Error while setting user');
    }
  };

  // function to remove wishlist job before submit
  const handleRemoveListJob = (
    id: number,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    event?.stopPropagation();
    setWishListJob(wishListJob.filter((job) => job.id !== id));
  };

  // set job with the value from the database
  useEffect(() => {
    if (jobDataName) {
      setSelectedJob(jobDataName);
      setSkip(true);
    }
  }, [jobDataName, jobDataLoading]);

  // Update jobs when category changes
  useEffect(() => {
    if (jobData) {
      setJobsStore(jobData.allJobs);
    }
  }, [jobData]);

  // Update categories when data is fetched
  useEffect(() => {
    if (categoriesData) {
      setCategoriesJobsStore(categoriesData.categories);
    }
  }, [categoriesData]);

  useEffect(() => {
    setInputValue('');
  }, [wishListJob]);

  return (
    <>
      {role === 'pro' && (
        <div className="setting-account">
          <>
            <form
              className={`setting-account__form ${jobLoading ? 'loading' : ''}`}
              onSubmit={handleSubmitJob}
              aria-label="Formulaire de sélection de métiers"
            >
              {/* {jobLoading && <Spinner />} */}
              <h1 className="setting-account__form__title">
                Options de recherche
              </h1>
              <h2 className="setting-account__subtitle">
                Séléctionnez un ou plusieurs métiers
              </h2>
              <Stack
                spacing={2}
                sx={{
                  width: '100%',
                }}
              >
                <Autocomplete
                  id="jobs"
                  freeSolo
                  options={jobStore}
                  getOptionLabel={(option: string | JobProps) =>
                    typeof option === 'string' ? option : option.name
                  }
                  renderOption={(props, option) => {
                    return (
                      <li {...props} key={option.id}>
                        {option.name}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rechercher"
                      inputRef={(node) => {
                        // Assign the input element to the inputRef to close the keyboard on mobile
                        inputRef.current = node; // input element to reference
                        if (typeof params.inputProps.ref === 'function') {
                          params.inputProps.ref(node); // Connect the input element to the Autocomplete
                        }
                      }}
                    />
                  )}
                  className="custom-autocomplete"
                  sx={autocompleteSx}
                  PopperComponent={(props) => (
                    <Popper
                      {...props}
                      modifiers={[
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 9], // Move popper down by 9px
                          },
                        },
                      ]}
                      sx={popperSx}
                      onClick={(event) => {
                        event.stopPropagation(), setInputValue('');
                      }}
                    />
                  )}
                  inputValue={inputValue}
                  onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    event.preventDefault();
                    if (newValue) {
                      if (typeof newValue !== 'string') {
                        setWishListJob([...wishListJob, newValue]);
                        // use blur to close the keyboard on mobile
                        if (inputRef.current) {
                          inputRef.current.blur();
                        }
                      }
                    }
                  }}
                />
              </Stack>
              <p className="request__form__or">ou</p>
              <SelectBox
                isSetting={true}
                data={categoriesJobsStore}
                selected={selectedCategory}
                isCategory={true}
                loading={categoryLoading}
                setSelected={(value: JobProps | CategoryProps) =>
                  setSelectedCategory(value.id)
                }
              />

              <SelectBox
                isSetting={true}
                isWishList={true}
                wishListJob={wishListJob}
                data={jobStore}
                isCategory={false}
                setWishListJob={setWishListJob}
                loading={jobLoading}
                selectedCategory={selectedCategory}
              />

              <ul className="setting-account__form__list">
                <h2 className="setting-account__subtitle">
                  Métiers à ajouter (max 5)
                </h2>
                <List sx={{ p: 0 }}>
                  <TransitionGroup>
                    {wishListJob &&
                      [...wishListJob].reverse().map((job: JobProps) => (
                        <Collapse key={job.id} timeout={200}>
                          <ListItem
                            key={job.id}
                            className="setting-account__form__list__tag"
                            aria-label={`Métier sélectionné: ${job.name}`}
                          >
                            <ListItemText
                              className="__name"
                              primary={job.name}
                              aria-label={`Métier actuel: ${job.name}`}
                              sx={{
                                '& .MuiTypography-root': {
                                  fontFamily: 'Fredoka, sans-serif',
                                  fontWeight: 400,
                                  paddingTop: 0,
                                  paddingBottom: 0,
                                  margin: 0,
                                },
                              }}
                            />
                            <button
                              className="setting-account__form__list__delete__button"
                              onClick={(event) => {
                                setJobError(''),
                                  handleRemoveListJob(job.id, event);
                              }}
                              aria-label={`Supprimer le métier ${job.name}`}
                            >
                              X
                            </button>
                          </ListItem>
                        </Collapse>
                      ))}
                  </TransitionGroup>
                </List>
              </ul>
              <div className="message-setting">
                <Stack sx={{ width: '100%' }} spacing={2}>
                  {jobError && (
                    <Fade in={!!jobError} timeout={300}>
                      <Alert variant="filled" severity="error">
                        {jobError}
                      </Alert>
                    </Fade>
                  )}
                </Stack>
              </div>
              <button
                className="setting-account__form__button"
                type="submit"
                aria-label="Valider les métiers"
              >
                valider les métiers
              </button>

              <ul
                className={`setting-account__form__list job ${userJobLoading || deleteJobLoading || categoryLoading ? 'loading' : ''}`}
              >
                {(userJobLoading || categoryLoading) && (
                  <Spinner className="small-spinner" />
                )}

                <h2 className="setting-account__subtitle">
                  Métiers séléctionnés
                </h2>
                <List sx={{ p: 0 }}>
                  {selectedJob && selectedJob.length > 0 ? (
                    <TransitionGroup>
                      {/* {jobDataLoading && <Spinner />} */}
                      {selectedJob.map((job: JobProps) => (
                        <Collapse key={job.id} timeout={200}>
                          <ListItem className="setting-account__form__list__tag">
                            <ListItemText
                              className="__name"
                              primary={job.name}
                              aria-label={`Métier actuel: ${job.name}`}
                              sx={{
                                '& .MuiTypography-root': {
                                  fontFamily: 'Fredoka, sans-serif',
                                  fontWeight: 400,
                                  paddingTop: 0,
                                  paddingBottom: 0,
                                  margin: 0,
                                },
                              }}
                            />
                            <button
                              className="setting-account__form__list__delete__button"
                              onClick={(event) =>
                                handleDeleteJob(job.id, event)
                              }
                              aria-label={`Supprimer le métier ${job.name}`}
                            >
                              X
                            </button>
                          </ListItem>
                        </Collapse>
                      ))}
                    </TransitionGroup>
                  ) : (
                    <p className="setting-account__form__list noJobs">
                      Vous n&apos;avez pas de métier séléctionné
                    </p>
                  )}
                </List>
              </ul>
            </form>

            <div
              className={`setting-account__radius ${settingLoading ? 'loading' : ''}`}
            >
              {settingLoading && <Spinner />}
              <label className="setting-account__radius__label">
                <h2 className="setting-account__subtitle">
                  Selectionnez une distance d&apos;action
                </h2>
                <span className="setting-account__radius__range">
                  {radius === 0
                    ? 'Toute la france'
                    : `Autour de moi: ${radius / 1000} Km`}
                </span>

                <Box className="slider-container" sx={{ width: 300 }}>
                  <Slider
                    aria-labelledby="radius-slider-label"
                    defaultValue={105}
                    aria-label="Distance d'action"
                    valueLabelDisplay="auto"
                    value={radius === 0 ? 105 : radius / 1000}
                    step={5}
                    marks
                    min={5}
                    max={105}
                    // transform 105 to 0 for condition in the function and database
                    onChange={(_, value) =>
                      setRadius(
                        (value as number) === 105 ? 0 : (value as number) * 1000
                      )
                    }
                    valueLabelFormat={(value) =>
                      value === 105 ? 'France' : `${value} Km`
                    }
                  />
                </Box>
                <div className="message">
                  <Stack sx={{ width: '100%' }} spacing={2}>
                    {message && (
                      <Fade in={!!message} timeout={300}>
                        <Alert variant="filled" severity="success">
                          {message}
                        </Alert>
                      </Fade>
                    )}
                  </Stack>
                </div>
                <button
                  className="setting-account__radius__button"
                  onClick={handleValidateRange}
                  aria-label="Valider la distance"
                >
                  Valider la distance
                </button>
              </label>
            </div>
          </>
        </div>
      )}
    </>
  );
}

export default SettingAccount;
