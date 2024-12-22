#!/bin/bash
git checkout HEAD~1 && pm2 restart kopatych-bun && pm2 logs kopatych-bun
