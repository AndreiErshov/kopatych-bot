#!/bin/bash
git pull && pm2 restart kopatych-bun && pm2 logs kopatych-bun
