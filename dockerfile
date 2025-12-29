FROM  --platform=${BUILDPLATFORM} ubuntu:22.04 AS base
USER root

RUN apt-get update -y

RUN apt-get install git sudo -y
RUN apt-get update && apt-get install --no-install-recommends -y \
  g++ \
  git \
  python3-pip \
  python-is-python3 \
  libxml2-dev \
  libxslt-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN git clone --recurse-submodules https://github.com/ArduPilot/ardupilot.git --depth 1

WORKDIR /ardupilot

USER root
RUN pip3 install future lxml pymavlink MAVProxy pexpect flake8==3.7.9 requests==2.27.1 monotonic==1.6 geocoder empy==3.3.4 configparser==4.0.2 click==7.1.2 decorator==4.4.2 dronecan pygame intelhex empy

RUN ./waf configure --board sitl
RUN ./waf copter
RUN ./waf plane
RUN ./waf rover

RUN echo '#!/bin/bash\n\
  VEHICLE_TYPE=${VEHICLE_TYPE:-ArduCopter}\n\
  SYSID=${SYSID:-1}\n\
  LOCATION=${LOCATION:-CMAC}\n\
  CUSTOM_LOC=${CUSTOM_LOC:-}\n\
  \n\
  CMD="python ./Tools/autotest/sim_vehicle.py -v $VEHICLE_TYPE --sysid $SYSID --location $LOCATION --no-mavproxy"\n\
  \n\
  if [ ! -z "$CUSTOM_LOC" ]; then\n\
  CMD="$CMD --custom-location=$CUSTOM_LOC"\n\
  fi\n\
  \n\
  echo "Launching: $CMD"\n\
  exec $CMD\n\
  ' > /ardupilot/launch.sh && chmod +x /ardupilot/launch.sh

ENTRYPOINT ["/ardupilot/launch.sh"]