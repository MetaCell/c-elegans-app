{
  description = "C-elegans-app development shell";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pwd = builtins.getEnv "PWD";

        buildDeps = with pkgs; [
          git
          nodejs_22
          yarn

          (python311.withPackages (
            ps: with ps; [
              pip
            ]
          ))
        ];

        devDeps = with pkgs;
          buildDeps ++ [
            google-cloud-sdk
          ];
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = devDeps;

          # https://github.com/NixOS/nixpkgs/issues/314713
          UV_USE_IO_URING=0;

          shellHook = ''
            # setup virtual environment
            VENV=venv
            if [ ! -d "$VENV" ]; then
              python -m venv $VENV
            fi
            source ./$VENV/bin/activate
            python dev-install.py

            export GOOGLE_APPLICATION_CREDENTIALS="$PWD/secret.json"
          '';
        };
      }
    );

}
