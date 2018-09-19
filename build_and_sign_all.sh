#!/bin/bash
set -e

#pushd ./saviour
export SIGNER=nadimkhan
export VERSION=v1.0.0.1
#git fetch
#git checkout ${VERSION}
#popd

#pushd gitian-builder
#this repo may be out of date, leading to differences in digests of output artifacts
#git pull origin master
export URL=https://github.com/nadimkhan/saviour.git
export COMMIT=v1.0.0.1

#linux 32/64
#cmd="./bin/gbuild --skip-image --allow-sudo --commit saviour=${COMMIT} --url saviour=${URL} ../saviour/contrib/gitian-descriptors/gitian-linux.yml"
#echo $cmd
./bin/gsign --signer $SIGNER --release ${VERSION}-linux --destination ../gitian.sigs/ ../saviour/contrib/gitian-descriptors/gitian-linux.yml

mv build/out/saviour-*.tar.gz build/out/src/saviour-*.tar.gz ../


#os x 64
./bin/gbuild --commit saviour=${COMMIT} --url saviour=${URL} ../saviour/contrib/gitian-descriptors/gitian-osx.yml
./bin/gsign --signer $SIGNER --release ${VERSION}-osx-unsigned --destination ../gitian.sigs/ ../saviour/contrib/gitian-descriptors/gitian-osx.yml
mv build/out/saviour-*-osx-unsigned.tar.gz inputs/saviour-osx-unsigned.tar.gz
mv build/out/saviour-*.tar.gz build/out/saviour-*.dmg ../


popd
