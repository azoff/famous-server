#!/bin/bash

# install git ssh keys first

NODE_VERSION=v0.8.7

apt-get install -y git make gcc g++

git clone git@github.com:azoff/famous-server.git $HOME/famous-server
git clone git@github.com:azoff/famous-client.git $HOME/famous-client
git clone git://github.com/joyent/node.git $HOME/node

cd $HOME/node
git fetch --tags
git checkout -b local
git reset --hard $NODE_VERSION
./configure && make && make install

cd $HOME/famous-server
make install

# add client and stripe json files
# then run `make server`