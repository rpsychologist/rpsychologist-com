#!/bin/bash
sh ./seed-dummy-data.sh
echo "## Starting gatsby in develop mode"
yarn workspace gatsby-theme-rpsych-cohend gatsby develop -H 0.0.0.0